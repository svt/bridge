import React from 'react'
import bridge from 'bridge'

import { Timeline as TimelineComponent } from '../components/Timeline'
import { useEffectWhileLoaded } from '../hooks/useEffectWhileLoaded'
import * as widgetUtils from '../utils/widget'

const FRAME_RATE_OPTIONS = ['23.97', '24', '25', '30', '50', '60']

/**
 * Get all timeline items
 * in the current project
 * 
 * @typedef {{
 *  data: any
 * }} TimelineItem
 * 
 * @returns { Promise.<TimelineItem[]> } 
 */
function getAllTimelineItems () {
  const allItems = bridge.state.getLocalState()?.items || {}
  return Object.values(allItems)
    .filter(item => item.type === 'bridge.types.timeline')
}

/**
 * Check whether a timeline item is currently playing
 * by comparing the current server time against the window
 * [willStartPlayingAt, willStartPlayingAt + duration].
 *
 * @param { any } item
 * @returns { Promise.<boolean> }
 */
async function isItemPlaying (item) {
  if (!item?.willStartPlayingAt) {
    return false
  }
  const now = await bridge.time.now()
  const end = item.willStartPlayingAt + (bridge.items.getEffectiveDuration(item) || Infinity)
  return now >= item.willStartPlayingAt && now < end
}

export function Timeline () {
  const [isFloated, setIsFloated] = React.useState(false)
  const [items, setItems] = React.useState([])
  const [duration, setDuration] = React.useState(null)
  const [frameRate, setFrameRate] = React.useState(null)
  const [timelineOptions, setTimelineOptions] = React.useState([])
  const [lockedId, setLockedId] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)

  /*
  Update the isFloated
  state to know if the 
  widget floats or not
  */
  React.useEffect(() => {
    async function getValue () {
      const isFloated = await widgetUtils.isFloated()
      setIsFloated(!!isFloated)
    }
    getValue()
  }, [])

  const timelineIdRef = React.useRef(null)
  const lockedIdRef = React.useRef(null)
  const currentChildIdsRef = React.useRef([])

  React.useEffect(() => {
    lockedIdRef.current = lockedId
  }, [lockedId])

  function refreshTimelineOptions () {
    setTimelineOptions(getAllTimelineItems().map(item => ({
      id: item.id,
      label: item.data?.name || item.id
    })))
  }

  async function loadChildren (timelineId) {
    const item = bridge.state.getLocalState()?.items?.[timelineId]
    setFrameRate(FRAME_RATE_OPTIONS[item?.data?.frameRate] ?? null)
    setDuration(item?.data?.duration ?? null)
    setIsPlaying(await isItemPlaying(item))
    if (!item?.children?.length) {
      currentChildIdsRef.current = []
      setItems([])
      return
    }

    const children = item.children.map(id => bridge.state.getLocalState()?.items?.[id])

    const mapped = await Promise.all(
      children
        .filter(Boolean)
        .map(async child => {
          const type = await bridge.types.getType(child.type)
          const trimmable = type?.id === 'bridge.types.trimmable' ||
                            (type?.ancestors?.includes('bridge.types.trimmable') ?? false)
          const resizable = 'duration' in (type?.properties ?? {})

          return {
            id: child.id,
            type: child.type,
            data: child.data,
            trimmable,
            resizable
          }
        })
    )

    currentChildIdsRef.current = mapped.map(child => child.id)
    setItems(mapped)
  }

  async function handleSelection (selection) {
    /*
    Ignore selection changes when
    locked to a specific timeline
    */
    if (lockedIdRef.current) {
      return
    }

    if (!selection?.[0]) {
      return
    }

    const item = await bridge.items.getItem(selection[0])
    if (item?.type !== 'bridge.types.timeline') {
      return
    }

    timelineIdRef.current = item.id
    loadChildren(item.id)
  }

  async function handleItemChange (itemId) {
    refreshTimelineOptions()

    if (!timelineIdRef.current) {
      return
    }

    const timeline = bridge.state.getLocalState()?.items?.[timelineIdRef.current]
    const isTimeline = itemId === timelineIdRef.current
    const isChild = timeline?.children?.includes(itemId)
    const wasChild = currentChildIdsRef.current.includes(itemId)

    if (isTimeline || isChild || wasChild) {
      loadChildren(timelineIdRef.current)
    }
  }

  async function handleDragChange (id, changes) {
    await bridge.items.applyItem(id, { data: changes }, true)
  }

  function handleLockChange (id) {
    const value = id || null
    setLockedId(value)
    lockedIdRef.current = value
    window.WIDGET_UPDATE?.({ lockedId: value })
    if (value) {
      timelineIdRef.current = value
      loadChildren(value)
    }
  }

  async function handleDrop (e) {
    e.preventDefault()

    if (!timelineIdRef.current) {
      return
    }

    const itemId = e.dataTransfer.getData('text/plain')
    const itemSpec = e.dataTransfer.getData('bridge/item')

    if (itemSpec) {
      try {
        const spec = JSON.parse(itemSpec)
        if (!spec.type) {
          return
        }
        const newId = await bridge.items.createItem(spec.type, spec?.data)
        bridge.commands.executeCommand('rundown.appendItem', timelineIdRef.current, newId)
      } catch (_) {
        console.warn('Tried to drop an invalid spec onto the timeline')
      }
      return
    }

    if (itemId) {
      bridge.commands.executeCommand('rundown.appendItem', timelineIdRef.current, itemId)
    }
  }

  function handleItemPlay (item) {
    if (item.id === timelineIdRef.current) {
      setIsPlaying(true)
    }
  }

  function handleItemStop (item) {
    if (item.id === timelineIdRef.current) {
      setIsPlaying(false)
    }
  }

  function handleItemEnd (item) {
    if (item.id === timelineIdRef.current) {
      setIsPlaying(false)
    }
  }

  useEffectWhileLoaded(() => {
    refreshTimelineOptions()

    /* Restore persisted lock from widget data */
    const persistedId = window.WIDGET_DATA?.lockedId
    if (persistedId) {
      setLockedId(persistedId)
      lockedIdRef.current = persistedId
      timelineIdRef.current = persistedId
      loadChildren(persistedId)
    }
    bridge.events.on('selection', handleSelection)
    bridge.events.on('item.change', handleItemChange)
    bridge.events.on('item.play', handleItemPlay)
    bridge.events.on('item.stop', handleItemStop)
    bridge.events.on('item.end', handleItemEnd)

    return () => {
      bridge.events.off('selection', handleSelection)
      bridge.events.off('item.change', handleItemChange)
      bridge.events.off('item.play', handleItemPlay)
      bridge.events.off('item.stop', handleItemStop)
      bridge.events.off('item.end', handleItemEnd)
    }
  }, [])

  /*
  When floated and not locked to a specific timeline, auto-lock to
  the first available option as soon as options are loaded
  */
  React.useEffect(() => {
    if (!isFloated || lockedId || !timelineOptions.length) {
      return
    }
    handleLockChange(timelineOptions[0].id)
  }, [isFloated, lockedId, timelineOptions])

  return (
    <TimelineComponent
      items={items}
      duration={duration}
      frameRate={frameRate}
      timelineOptions={timelineOptions}
      lockedId={lockedId}
      timelineId={timelineIdRef.current}
      isPlaying={isPlaying}
      isFloated={isFloated}
      onLockChange={handleLockChange}
      onItemChange={handleDragChange}
      onDrop={handleDrop}
    />
  )
}
