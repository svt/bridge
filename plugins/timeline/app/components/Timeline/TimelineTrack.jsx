import React from 'react'
import bridge from 'bridge'

import './TimelineTrack.css'

import { useAsyncValue } from '../../../../shared/hooks/useAsyncValue'
import { useEffectWhileLoaded } from '../../../../shared/hooks/useEffectWhileLoaded'

import * as utils from './utils'

/**
 * Define the shortest duration a clip
 * can be after a resize or trim in milliseconds
 * @type { number }
 */
const MIN_DURATION_MS = 100

/**
 * Clips MUST not start
 * before the timeline
 * i.e. they cannot have a negative delay
 * @type { number }
 */
const MIN_DELAY_MS = 0

/**
 * Pixels within which a drag
 * edge snaps to a neighbour
 * @type { number }
 */
const SNAP_THRESHOLD_PX = 8

export function TimelineTrack ({ spec, item, allItems = [], onChange }) {
  const [localItem, setLocalItem] = React.useState(item)
  const [isSelected, setIsSelected] = React.useState(false)
  const isDragging = React.useRef(false)
  const dragValuesRef = React.useRef({ delay: 0, inPoint: 0, outPoint: 0 })

  const [name] = useAsyncValue(() => {
    /*
    Make sure to check if there
    really is a variable to render
    as that operation is rather expensive
    */
    if (!bridge.variables.stringContainsVariable(item?.data?.name)) {
      return item?.data?.name
    }

    return bridge.items.renderValue(item.id, 'data.name')
  }, [item?.data?.name])

  /*
  Mirror the incoming item into local state so that drag operations
  can update visuals immediately without waiting for a round trip.
  While a drag is active, external item updates are ignored so the
  two don't fight each other.
  */
  React.useEffect(() => {
    if (!isDragging.current) {
      setLocalItem(item)
    }
  }, [item])

  /*
  Keep the selection highlight in sync with the global selection state.
  Runs for the lifetime of the page so it also cleans up on pagehide.
  */
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

  /* Snap ms to the nearest neighbour or frame boundary within the threshold. */
  function getSnapped (ms, snapPoints) {
    const thresholdMs = utils.pixelsToMs(SNAP_THRESHOLD_PX, spec.scale)
    return utils.snapMs(ms, snapPoints, thresholdMs, spec.frameRate)
  }

  /*
  Body drag — moves the clip along the timeline by changing delay.
  Snaps against both the leading and trailing edges of all other clips,
  choosing whichever edge is closer to a snap point.
  */
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

  /*
  Right-edge resize for trimmable items that have a known source duration.
  Adjusts outPoint within [inPoint + MIN_DURATION_MS, sourceDuration],
  so the user can never trim past the end of the source media.
  */
  function startOutPointResize (startX, delay) {
    const startOutPoint = localItem.data?.outPoint ?? localItem.data?.duration ?? 0
    const startInPoint = localItem.data?.inPoint ?? 0
    const maxOutPoint = localItem.data?.duration

    dragValuesRef.current = { delay, inPoint: startInPoint, outPoint: startOutPoint }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const rawOutPoint = Math.max(startInPoint + MIN_DURATION_MS, startOutPoint + dMs)
      const clampedOutPoint = Math.min(maxOutPoint, rawOutPoint)
      const trailRaw = delay + (clampedOutPoint - startInPoint)
      const snappedTrail = getSnapped(trailRaw, utils.getSnapPoints(allItems, item.id))
      const finalOutPoint = utils.quantizeToFrame(
        Math.min(maxOutPoint, Math.max(startInPoint + MIN_DURATION_MS, snappedTrail - delay + startInPoint)),
        spec.frameRate
      )
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
  }

  /*
  Right-edge resize for items without a fixed source duration (non-trimmable,
  or trimmable items whose duration hasn't been populated yet).
  Adjusts duration directly with no upper bound.
  */
  function startDurationResize (startX, delay) {
    const startDuration = localItem.data?.duration || 0
    dragValuesRef.current = { delay, duration: startDuration }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const trailRaw = delay + Math.max(MIN_DURATION_MS, startDuration + dMs)
      const snappedTrail = getSnapped(trailRaw, utils.getSnapPoints(allItems, item.id))
      const newDuration = utils.quantizeToFrame(Math.max(MIN_DURATION_MS, snappedTrail - delay), spec.frameRate)
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

  /*
  Right-edge resize handle mousedown — dispatches to the appropriate
  resize strategy based on whether the item has a known source duration.
  */
  function handleResizeMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    e.stopPropagation()
    isDragging.current = true

    const delay = localItem.data?.delay || 0
    const useOutPoint = item.trimmable && localItem.data?.duration > 0

    if (useOutPoint) {
      startOutPointResize(e.clientX, delay)
    } else {
      startDurationResize(e.clientX, delay)
    }
  }

  /*
  Left-edge trim handle mousedown — adjusts inPoint while keeping the
  clip's right edge (outPoint) fixed on the timeline. The delay is shifted
  by the same amount as inPoint so the visible end of the clip stays put.
  Only shown/usable when the item type inherits bridge.types.trimmable
  and a source duration is known.
  */
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
      const newInPoint = utils.quantizeToFrame(Math.max(0, Math.min(startOutPoint - MIN_DURATION_MS, startInPoint + dMs)), spec.frameRate)
      const newDelay = utils.quantizeToFrame(Math.max(MIN_DELAY_MS, startDelay + (newInPoint - startInPoint)), spec.frameRate)

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
  const sourceDuration = localItem.data?.duration || 0
  const inPoint = localItem.data?.inPoint || 0
  const delay = localItem.data?.delay || 0

  const pixelWidth = utils.getPixelWidth(effectiveDuration, spec.scale)
  const isNarrow = pixelWidth < 100

  return (
    <div className='TimelineTrack'>
      {item.trimmable && sourceDuration > 0 && (
        <div
          className='TimelineTrack-ghost'
          style={{
            backgroundColor: localItem?.data?.color,
            width: `${utils.getPixelWidth(sourceDuration, spec.scale)}px`,
            left: `${utils.getPixelWidth(delay - inPoint, spec.scale)}px`,
          }}
        />
      )}
      <div
        className='TimelineTrack-item-wrapper'
        style={{ marginLeft: `${utils.getPixelWidth(delay, spec.scale)}px` }}
      >
        <div
          className='TimelineTrack-item'
          style={{
            backgroundColor: item?.data?.color,
            width: `${pixelWidth}px`,
            boxShadow: isSelected ? 'inset 0 0 0 1px var(--Timeline-color--text)' : undefined,
          }}
          onMouseDown={handleBodyMouseDown}
        >
          {item.trimmable && sourceDuration > 0 && <div className='TimelineTrack-trim-handle' onMouseDown={handleTrimMouseDown} />}
          {!isNarrow && <span className='TimelineTrack-item-label'>{name}</span>}
          {item.resizable && <div className='TimelineTrack-resize-handle' onMouseDown={handleResizeMouseDown} />}
        </div>
        {isNarrow && <span className='TimelineTrack-item-label--external'>{name}</span>}
      </div>
    </div>
  )
}