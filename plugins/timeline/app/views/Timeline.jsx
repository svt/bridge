import React from 'react'
import bridge from 'bridge'

import { Timeline as TimelineComponent } from '../components/Timeline'
import { useEffectWhileLoaded } from '../hooks/useEffectWhileLoaded'

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

export function Timeline () {
  const [items, setItems] = React.useState([])
  const [frameRate, setFrameRate] = React.useState(null)
  const [timelineOptions, setTimelineOptions] = React.useState([])
  const [lockedId, setLockedId] = React.useState(null)
  const [isPlaying, setIsPlaying] = React.useState(false)
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
    const item = await bridge.items.getItem(timelineId)
    setFrameRate(FRAME_RATE_OPTIONS[item?.data?.frameRate] ?? null)
    if (!item?.children?.length) {
      currentChildIdsRef.current = []
      setItems([])
      return
    }

    const children = await Promise.all(
      item.children.map(id => bridge.items.getItem(id))
    )

    const mapped = await Promise.all(
      children
        .filter(Boolean)
        .map(async child => {
          const type = await bridge.types.getType(child.type)
          const trimmable = type?.id === 'bridge.types.trimmable' ||
                            (type?.ancestors?.includes('bridge.types.trimmable') ?? false)
          return {
            id: child.id,
            type: child.type,
            data: child.data,
            trimmable
          }
        })
    )

    currentChildIdsRef.current = mapped.map(child => child.id)
    setItems(mapped)
  }

  async function handleSelection (selection) {
    /* Ignore selection changes when locked to a specific timeline */
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
    if (!timelineIdRef.current) {
      return
    }

    refreshTimelineOptions()

    const timeline = await bridge.items.getItem(timelineIdRef.current)
    const isTimeline = itemId === timelineIdRef.current
    const isChild = timeline?.children?.includes(itemId)
    const wasChild = currentChildIdsRef.current.includes(itemId)

    if (isTimeline || isChild || wasChild) {
      loadChildren(timelineIdRef.current)
    }
  }

  async function handleDragChange (id, changes) {
    await bridge.items.applyItem(id, { data: changes }, true)

    if (!timelineIdRef.current) {
      return
    }

    const updatedItems = items.map(child =>
      child.id === id ? { ...child, data: { ...child.data, ...changes } } : child
    )
    const totalDuration = updatedItems.reduce((max, child) => {
      return Math.max(max, (child.data?.delay || 0) + bridge.items.getEffectiveDuration(child))
    }, 0)
    await bridge.items.applyItem(timelineIdRef.current, { data: { duration: totalDuration } }, true)
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

    bridge.client.selection.getSelection().then(handleSelection)
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

  return (
    <TimelineComponent
      items={items}
      frameRate={frameRate}
      timelineOptions={timelineOptions}
      lockedId={lockedId}
      timelineId={timelineIdRef.current}
      isPlaying={isPlaying}
      onLockChange={handleLockChange}
      onItemChange={handleDragChange}
    />
  )
}
