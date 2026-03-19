import React from 'react'
import bridge from 'bridge'

import { Timeline as TimelineComponent } from './components/Timeline'

const FRAME_RATE_OPTIONS = ['23.97', '24', '25', '30', '50', '60']

export default function App () {
  const [items, setItems] = React.useState([])
  const [frameRate, setFrameRate] = React.useState(null)
  const timelineIdRef = React.useRef(null)

  async function loadChildren (timelineId) {
    const item = await bridge.items.getItem(timelineId)
    setFrameRate(FRAME_RATE_OPTIONS[item?.data?.frameRate] ?? null)
    if (!item?.children?.length) {
      setItems([])
      return
    }

    const children = await Promise.all(
      item.children.map(id => bridge.items.getItem(id))
    )

    setItems(
      children
        .filter(Boolean)
        .map(child => ({
          id: child.id,
          label: child.data?.name,
          color: child.data?.color,
          duration: Number(child.data?.duration) || 0,
          delay: Number(child.data?.delay) || 0
        }))
    )
  }

  async function handleSelection (selection) {
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

    const timeline = await bridge.items.getItem(timelineIdRef.current)
    const isTimeline = itemId === timelineIdRef.current
    const isChild = timeline?.children?.includes(itemId)

    if (isTimeline || isChild) {
      loadChildren(timelineIdRef.current)
    }
  }

  async function handleDragChange (id, changes) {
    await bridge.items.applyItem(id, { data: changes }, true)

    if (!timelineIdRef.current) {
      return
    }

    const updatedItems = items.map(child =>
      child.id === id ? { ...child, ...changes } : child
    )
    const totalDuration = updatedItems.reduce((max, child) => {
      return Math.max(max, (child.delay || 0) + (child.duration || 0))
    }, 0)
    await bridge.items.applyItem(timelineIdRef.current, { data: { duration: totalDuration } }, true)
  }

  React.useEffect(() => {
    bridge.client.selection.getSelection().then(handleSelection)
    bridge.events.on('selection', handleSelection)
    bridge.events.on('item.change', handleItemChange)
    return () => {
      bridge.events.off('selection', handleSelection)
      bridge.events.off('item.change', handleItemChange)
    }
  }, [])

  return (
    <div className='App'>
      <TimelineComponent items={items} frameRate={frameRate} onItemChange={handleDragChange} />
    </div>
  )
}
