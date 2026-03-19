import React from 'react'

import './TimelineTrack.css'

import * as utils from './utils'

const MIN_DURATION_MS = 100
const MIN_DELAY_MS = 0
const SNAP_THRESHOLD_PX = 8

export function TimelineTrack ({ spec, item, allItems = [], onChange }) {
  const [localItem, setLocalItem] = React.useState(item)
  const isDragging = React.useRef(false)
  const dragValuesRef = React.useRef({ delay: 0, duration: 0 })

  React.useEffect(() => {
    if (!isDragging.current) {
      setLocalItem(item)
    }
  }, [item])

  function getSnapped (ms, snapPoints) {
    const thresholdMs = utils.pixelsToMs(SNAP_THRESHOLD_PX, spec.scale)
    return utils.snapMs(ms, snapPoints, thresholdMs, spec.frameRate)
  }

  function handleBodyMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    isDragging.current = true
    const startX = e.clientX
    const startDelay = localItem.delay || 0
    const duration = localItem.duration || 0
    dragValuesRef.current = { delay: startDelay, duration }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const rawDelay = Math.max(MIN_DELAY_MS, startDelay + dMs)
      const snapPoints = utils.getSnapPoints(allItems, item.id)

      /* Check snap on leading edge, then trailing edge; pick tighter snap */
      const thresholdMs = utils.pixelsToMs(SNAP_THRESHOLD_PX, spec.scale)
      let snappedDelay = rawDelay

      const leadSnap = utils.snapMs(rawDelay, snapPoints, thresholdMs, spec.frameRate)
      const trailRaw = rawDelay + duration
      const trailSnap = utils.snapMs(trailRaw, snapPoints, thresholdMs, spec.frameRate)

      const leadDelta = Math.abs(leadSnap - rawDelay)
      const trailDelta = Math.abs(trailSnap - trailRaw)

      if (leadDelta <= trailDelta) {
        snappedDelay = Math.max(MIN_DELAY_MS, leadSnap)
      } else {
        snappedDelay = Math.max(MIN_DELAY_MS, trailSnap - duration)
      }

      dragValuesRef.current.delay = snappedDelay
      setLocalItem(cur => ({ ...cur, delay: snappedDelay }))
    }

    function onMouseUp () {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDragging.current = false
      onChange?.(item.id, { ...dragValuesRef.current })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  function handleResizeMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    const startX = e.clientX
    const startDuration = localItem.duration || 0
    const delay = localItem.delay || 0
    dragValuesRef.current = { delay, duration: startDuration }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const rawDuration = Math.max(MIN_DURATION_MS, startDuration + dMs)
      const snapPoints = utils.getSnapPoints(allItems, item.id)
      const trailRaw = delay + rawDuration
      const snappedTrail = getSnapped(trailRaw, snapPoints)
      const newDuration = Math.max(MIN_DURATION_MS, snappedTrail - delay)

      dragValuesRef.current.duration = newDuration
      setLocalItem(cur => ({ ...cur, duration: newDuration }))
    }

    function onMouseUp () {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDragging.current = false
      onChange?.(item.id, { ...dragValuesRef.current })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  return (
    <div className='TimelineTrack'>
      <div
        className='TimelineTrack-item'
        style={{
          backgroundColor: localItem?.color,
          width: `${utils.getPixelWidth(localItem.duration || 0, spec.scale)}px`,
          marginLeft: `${utils.getPixelWidth(localItem.delay || 0, spec.scale)}px`,
        }}
        onMouseDown={handleBodyMouseDown}
      >
        <span className='TimelineTrack-item-label'>{localItem?.label}</span>
        <div className='TimelineTrack-resize-handle' onMouseDown={handleResizeMouseDown} />
      </div>
    </div>
  )
}