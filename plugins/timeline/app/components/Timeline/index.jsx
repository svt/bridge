import React from 'react'
import bridge from 'bridge'

import { TimelineTrack } from './TimelineTrack'
import { TimelineHeader } from './TimelineHeader'
import { TimelineFooter } from './TimelineFooter'
import { NoTimelineSelected } from '../NoTimelineSelected'

import { Playhead } from './Playhead'

import * as utils from './utils'

import './style.css'
import './colors.css'


const MAX_SCALE = 20

function computeMinScale (durationMs, viewportWidth) {
  if (!durationMs || !viewportWidth) return 0.01
  /*
  Find the scale where the full content (duration + 100px overshoot)
  just fits inside the viewport so the out-of-bounds area never
  takes over the whole visible area
  */
  const durationPx = (durationMs / 1000) * 100  /* at scale 1 */
  return Math.max(0.001, (viewportWidth - 100) / durationPx)
}

function clampScale (scale, minScale) {
  return Math.min(MAX_SCALE, Math.max(minScale, scale))
}

const DUMMY_DATA = [
  {
    id: '1',
    label: 'Item 1',
    color: '#6E2276',
    duration: 1000,
    delay: 500
  },
  {
    id: '2',
    label: 'Item 2',
    color: '#421C7F',
    duration: 5000,
    delay: 0
  },
  {
    id: '3',
    label: 'Item 3',
    color: '#008092',
    duration: 3000,
    delay: 1000
  },
  {
    id: '4',
    label: 'Item 4',
    color: '#008092',
    duration: 3000,
    delay: 1000
  }
]

export function Timeline ({ items = DUMMY_DATA, frameRate = null, timelineOptions = [], lockedId = null, timelineId = null, isPlaying = false, isFloated = false, onLockChange, onItemChange, onDrop = () => {} }) {
  const contentRef = React.useRef(null)
  const [spec, setSpec] = React.useState(() => utils.getTimelineSpec([]))
  const [minScale, setMinScale] = React.useState(0.001)
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)

  /* Recompute minScale when the viewport or duration changes */
  React.useLayoutEffect(() => {
    if (!contentRef.current) return
    const update = () => {
      setMinScale(s => {
        const next = computeMinScale(spec.duration, contentRef.current?.clientWidth)
        /* Also clamp the current scale up if it's now below the new minimum */
        setSpec(current => {
          if (current.scale < next) return { ...current, scale: next }
          return current
        })
        return next
      })
    }
    const ro = new ResizeObserver(update)
    ro.observe(contentRef.current)
    update()
    return () => ro.disconnect()
  }, [spec.duration])

  /*
  Playhead is stored in ms so it represents a fixed point in time
  Its pixel position is derived at render time from the current scale
  */
  const [playheadMs, setPlayheadMs] = React.useState(null)

  /*
  Keep a ref so scale handlers always read the latest
  playheadMs without stale closures
  */
  const playheadMsRef = React.useRef(null)
  React.useEffect(() => {
    playheadMsRef.current = playheadMs
  }, [playheadMs])

  /*
  Store the desired scrollLeft after a scale change
  Applied in useLayoutEffect so React has already committed
  the new scale (and therefore the new content width) by then
  */
  const pendingScrollRef = React.useRef(null)

  React.useLayoutEffect(() => {
    if (pendingScrollRef.current !== null && contentRef.current) {
      contentRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
    }
  }, [spec])

  /*
  Keep a ref to the latest spec.duration so the rAF tick
  can read it without stale closures
  */
  const specDurationRef = React.useRef(spec.duration)
  React.useEffect(() => {
    specDurationRef.current = spec.duration
  }, [spec.duration])

  /*
  Offset between server time and local Date.now()
  Fetched once on mount (bridge.time.now() caches the server time
  with a 10 s TTL so subsequent calls are synchronous)
  Falls back to 0 (local time) until the first response arrives
  */
  const timeOffsetRef = React.useRef(0)
  React.useEffect(() => {
    bridge.time.now().then(serverNow => {
      timeOffsetRef.current = serverNow - Date.now()
    })
  }, [])

  /*
  When the timeline is playing, run a rAF loop that derives playheadMs
  from willStartPlayingAt in local state. This works for both free play
  (willStartPlayingAt is fixed at play time) and TC-latched play
  (willStartPlayingAt is continuously updated by TimelineSequencer)
  */
  React.useEffect(() => {
    if (!isPlaying || !timelineId) {
      setPlayheadMs(null)
      return
    }

    let rafId
    function tick () {
      const item = bridge.state.getLocalState()?.items?.[timelineId]
      if (item?.willStartPlayingAt) {
        const positionMs = (Date.now() + timeOffsetRef.current) - item.willStartPlayingAt
        const duration = specDurationRef.current

        if (duration > 0 && positionMs >= duration) {
          /* Clamp to end and stop the loop — item.end will set isPlaying=false */
          setPlayheadMs(duration)
          return
        }

        setPlayheadMs(positionMs)
      }
      rafId = requestAnimationFrame(tick)
    }
    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [isPlaying, timelineId])

  React.useEffect(() => {
    setSpec(current => ({
      ...utils.getTimelineSpec(items),
      scale: current.scale,
      frameRate: current.frameRate
    }))
  }, [items])

  React.useEffect(() => {
    if (frameRate == null) return
    setSpec(current => ({ ...current, frameRate: parseFloat(frameRate) }))
  }, [frameRate])

  function computeScrollAfterScale (currentScale, newScale, cursorOffsetX) {
    const scrollLeft = contentRef.current?.scrollLeft ?? 0
    /*
    If a cursor position is provided, anchor the zoom on that pixel.
    Otherwise fall back to the playhead position (e.g. for the footer slider).
    */
    let anchorMs
    if (cursorOffsetX != null) {
      anchorMs = utils.pixelsToMs(scrollLeft + cursorOffsetX, currentScale)
    } else {
      anchorMs = playheadMsRef.current ?? 0
    }
    const anchorPxBefore = utils.getPixelWidth(anchorMs, currentScale)
    const anchorPxAfter = utils.getPixelWidth(anchorMs, newScale)
    const visualOffset = anchorPxBefore - scrollLeft
    return anchorPxAfter - visualOffset
  }

  function applyScale (newScale) {
    const clamped = clampScale(newScale, minScale)
    setSpec(current => {
      pendingScrollRef.current = computeScrollAfterScale(current.scale, clamped, null)
      return { ...current, scale: clamped }
    })
  }

  function applyScaleDelta (delta, cursorOffsetX) {
    setSpec(current => {
      const clamped = clampScale(current.scale + delta, minScale)
      pendingScrollRef.current = computeScrollAfterScale(current.scale, clamped, cursorOffsetX)
      return { ...current, scale: clamped }
    })
  }

  function handleDragOver (e) {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    /*
    Only clear the state when the drag truly leaves the content area,
    not when moving between child elements
    */
    if (e.currentTarget.contains(e.relatedTarget)) {
      return
    }
    setIsDraggedOver(false)
  }

  function handleDrop (e) {
    setIsDraggedOver(false)
    onDrop(e)
  }

  function handleWheel (e) {
    /*
    Pinch gesture on trackpad (ctrlKey is set by the browser)
    or alt + scroll wheel
    */
    if (!e.ctrlKey && !e.altKey) {
      return
    }

    e.preventDefault()

    const delta = e.ctrlKey
      ? e.deltaY * -0.02  /* pinch — small deltas */
      : e.deltaY * -0.05  /* alt+scroll — larger deltas */

    const rect = contentRef.current?.getBoundingClientRect()
    const cursorOffsetX = rect ? e.clientX - rect.left : null

    applyScaleDelta(delta, cursorOffsetX)
  }

  const durationPx = utils.getPixelWidth(spec.duration ?? 0, spec.scale)
  const playheadX = playheadMs != null ? utils.getPixelWidth(playheadMs, spec.scale) : null

  return (
    <div className='Timeline'>
      <div
        className={`Timeline-content ${(isDraggedOver && timelineId) ? 'is-draggedOver' : ''}`}
        ref={contentRef}
        onWheel={handleWheel}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {
          (!timelineId && !lockedId)
            ? <NoTimelineSelected />
            : (
              <div className='Timeline-body' style={{ width: `${durationPx + 100}px` }}>
                <TimelineHeader spec={spec} />
                <div className='Timeline-tracks'>
                  {
                    items.map((item, i) => {
                      return (
                        <TimelineTrack key={item.id || i} spec={spec} item={item} allItems={items} onChange={onItemChange} />
                      )
                    })
                  }
                </div>
                <div
                  className='Timeline-outOfBounds'
                  style={{ left: `${durationPx}px` }}
                />
                <Playhead x={playheadX} />
              </div>
            )
        }
      </div>
      <TimelineFooter
        scale={spec.scale ?? 1}
        min={minScale}
        max={MAX_SCALE}
        frameRate={frameRate}
        timelineOptions={timelineOptions}
        lockedId={lockedId}
        isFloated={isFloated}
        onLockChange={onLockChange}
        onScale={applyScale}
      />
    </div>
  )
}