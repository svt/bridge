import React from 'react'
import bridge from 'bridge'

import './TimelineTrack.css'
import { useEffectWhileLoaded } from '../../hooks/useEffectWhileLoaded'

import * as utils from './utils'

const MIN_DURATION_MS = 100
const MIN_DELAY_MS = 0
const SNAP_THRESHOLD_PX = 8

export function TimelineTrack ({ spec, item, allItems = [], onChange }) {
  const [localItem, setLocalItem] = React.useState(item)
  const [isSelected, setIsSelected] = React.useState(false)
  const isDragging = React.useRef(false)
  const dragValuesRef = React.useRef({ delay: 0, inPoint: 0, outPoint: 0 })

  React.useEffect(() => {
    if (!isDragging.current) {
      setLocalItem(item)
    }
  }, [item])

  useEffectWhileLoaded(() => {
    function handleSelection (selection) {
      setIsSelected(Array.isArray(selection)
        ? selection.includes(item.id)
        : selection === item.id
      )
    }
    bridge.client.selection.getSelection().then(handleSelection)
    bridge.events.on('selection', handleSelection)
    return () => bridge.events.off('selection', handleSelection)
  }, [item.id])

  function getSnapped (ms, snapPoints) {
    const thresholdMs = utils.pixelsToMs(SNAP_THRESHOLD_PX, spec.scale)
    return utils.snapMs(ms, snapPoints, thresholdMs, spec.frameRate)
  }

  function handleBodyMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    
    bridge.client.selection.setSelection(item.id)

    isDragging.current = true
    const startX = e.clientX
    const startDelay = localItem.data?.delay || 0
    const effectiveDuration = bridge.items.getEffectiveDuration(localItem)
    dragValuesRef.current = { delay: startDelay, inPoint: localItem.data?.inPoint ?? 0, outPoint: localItem.data?.outPoint ?? localItem.data?.duration ?? 0 }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const rawDelay = Math.max(MIN_DELAY_MS, startDelay + dMs)
      const snapPoints = utils.getSnapPoints(allItems, item.id)

      /* Check snap on leading edge, then trailing edge; pick tighter snap */
      const thresholdMs = utils.pixelsToMs(SNAP_THRESHOLD_PX, spec.scale)
      let snappedDelay = rawDelay

      const leadSnap = utils.snapMs(rawDelay, snapPoints, thresholdMs, spec.frameRate)
      const trailRaw = rawDelay + effectiveDuration
      const trailSnap = utils.snapMs(trailRaw, snapPoints, thresholdMs, spec.frameRate)

      const leadDelta = Math.abs(leadSnap - rawDelay)
      const trailDelta = Math.abs(trailSnap - trailRaw)

      if (leadDelta <= trailDelta) {
        snappedDelay = Math.max(MIN_DELAY_MS, leadSnap)
      } else {
        snappedDelay = Math.max(MIN_DELAY_MS, trailSnap - effectiveDuration)
      }

      dragValuesRef.current.delay = snappedDelay
      setLocalItem(cur => ({ ...cur, data: { ...cur.data, delay: snappedDelay } }))
    }

    function onMouseUp () {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDragging.current = false
      onChange?.(item.id, { delay: dragValuesRef.current.delay })
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
    const delay = localItem.data?.delay || 0

    if (item.trimmable) {
      const startOutPoint = localItem.data?.outPoint ?? localItem.data?.duration ?? 0
      const startInPoint = localItem.data?.inPoint ?? 0
      dragValuesRef.current = { delay, inPoint: startInPoint, outPoint: startOutPoint }

      function onMouseMove (e) {
        const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
        const rawOutPoint = Math.max(startInPoint + MIN_DURATION_MS, startOutPoint + dMs)
        
        /*
        outPoint can't exceed source duration,
        only cap when duration is known
        */
        const maxOutPoint = localItem.data?.duration > 0 ? localItem.data.duration : Infinity
        const clampedOutPoint = Math.min(maxOutPoint, rawOutPoint)
        const snapPoints = utils.getSnapPoints(allItems, item.id)
        const trailRaw = delay + (clampedOutPoint - startInPoint)
        const snappedTrail = getSnapped(trailRaw, snapPoints)
        const newOutPoint = Math.max(startInPoint + MIN_DURATION_MS, snappedTrail - delay + startInPoint)
        const finalOutPoint = Math.min(maxOutPoint, newOutPoint)

        dragValuesRef.current.outPoint = finalOutPoint
        setLocalItem(cur => ({ ...cur, data: { ...cur.data, outPoint: finalOutPoint } }))
      }

      function onMouseUp () {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        isDragging.current = false
        onChange?.(item.id, { outPoint: dragValuesRef.current.outPoint })
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    } else {
      const startDuration = localItem.data?.duration || 0
      dragValuesRef.current = { delay, duration: startDuration }

      function onMouseMove (e) {
        const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
        const rawDuration = Math.max(MIN_DURATION_MS, startDuration + dMs)
        const snapPoints = utils.getSnapPoints(allItems, item.id)
        const trailRaw = delay + rawDuration
        const snappedTrail = getSnapped(trailRaw, snapPoints)
        const newDuration = Math.max(MIN_DURATION_MS, snappedTrail - delay)

        dragValuesRef.current.duration = newDuration
        setLocalItem(cur => ({ ...cur, data: { ...cur.data, duration: newDuration } }))
      }

      function onMouseUp () {
        window.removeEventListener('mousemove', onMouseMove)
        window.removeEventListener('mouseup', onMouseUp)
        isDragging.current = false
        onChange?.(item.id, { duration: dragValuesRef.current.duration })
      }

      window.addEventListener('mousemove', onMouseMove)
      window.addEventListener('mouseup', onMouseUp)
    }
  }

  function handleTrimMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true
    const startX = e.clientX
    const startInPoint = localItem.data?.inPoint ?? 0
    const startDelay = localItem.data?.delay || 0
    const startOutPoint = localItem.data?.outPoint ?? localItem.data?.duration ?? 0
    dragValuesRef.current = { delay: startDelay, inPoint: startInPoint, outPoint: startOutPoint }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      /*
      Trim the in-point while keeping the out-point (and therefore the
      clip's end position on the timeline) fixed
      */
      const newInPoint = Math.max(0, Math.min(startOutPoint - MIN_DURATION_MS, startInPoint + dMs))
      const newDelay = Math.max(MIN_DELAY_MS, startDelay + (newInPoint - startInPoint))

      dragValuesRef.current.inPoint = newInPoint
      dragValuesRef.current.delay = newDelay
      setLocalItem(cur => ({ ...cur, data: { ...cur.data, inPoint: newInPoint, delay: newDelay } }))
    }

    function onMouseUp () {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      isDragging.current = false
      onChange?.(item.id, { delay: dragValuesRef.current.delay, inPoint: dragValuesRef.current.inPoint })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const effectiveDuration = bridge.items.getEffectiveDuration(localItem)

  return (
    <div className='TimelineTrack'>
      <div
        className='TimelineTrack-item'
        style={{
          backgroundColor: localItem?.data?.color,
          width: `${utils.getPixelWidth(effectiveDuration, spec.scale)}px`,
          marginLeft: `${utils.getPixelWidth(localItem.data?.delay || 0, spec.scale)}px`,
          boxShadow: isSelected ? 'inset 0 0 0 1px var(--Timeline-color--text)' : undefined,
        }}
        onMouseDown={handleBodyMouseDown}
      >
        {item.trimmable && <div className='TimelineTrack-trim-handle' onMouseDown={handleTrimMouseDown} />}
        <span className='TimelineTrack-item-label'>{localItem?.data?.name}</span>
        <div className='TimelineTrack-resize-handle' onMouseDown={handleResizeMouseDown} />
      </div>
    </div>
  )
}