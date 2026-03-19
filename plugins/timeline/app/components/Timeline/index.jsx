import React from 'react'

import { TimelineTrack } from './TimelineTrack'
import { TimelineHeader } from './TimelineHeader'
import { TimelineFooter } from './TimelineFooter'
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
  takes over the whole visible area.
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

export function Timeline ({ items = DUMMY_DATA, frameRate = null, onItemChange }) {
  const contentRef = React.useRef(null)
  const [spec, setSpec] = React.useState(() => utils.getTimelineSpec([]))
  const [minScale, setMinScale] = React.useState(0.001)

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
  Playhead is stored in ms so it represents a fixed point in time.
  Its pixel position is derived at render time from the current scale.
  */
  const [playheadMs, setPlayheadMs] = React.useState(null)
  const [ghostX, setGhostX] = React.useState(null)

  /*
  Keep a ref so scale handlers always read the latest
  playheadMs without stale closures.
  */
  const playheadMsRef = React.useRef(null)
  React.useEffect(() => {
    playheadMsRef.current = playheadMs
  }, [playheadMs])

  /*
  Store the desired scrollLeft after a scale change.
  Applied in useLayoutEffect so React has already committed
  the new scale (and therefore the new content width) by then.
  */
  const pendingScrollRef = React.useRef(null)

  React.useLayoutEffect(() => {
    if (pendingScrollRef.current !== null && contentRef.current) {
      contentRef.current.scrollLeft = pendingScrollRef.current
      pendingScrollRef.current = null
    }
  }, [spec])

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

  function computeScrollAfterScale (currentScale, newScale) {
    /*
    Convert the playhead time to pixels at both scales so the
    anchor pixel position scales correctly with the content.
    */
    const ms = playheadMsRef.current ?? 0
    const anchorXBefore = utils.getPixelWidth(ms, currentScale)
    const anchorXAfter = utils.getPixelWidth(ms, newScale)
    const scrollLeft = contentRef.current?.scrollLeft ?? 0
    const visualOffset = anchorXBefore - scrollLeft
    return anchorXAfter - visualOffset
  }

  function applyScale (newScale) {
    const clamped = clampScale(newScale, minScale)
    setSpec(current => {
      pendingScrollRef.current = computeScrollAfterScale(current.scale, clamped)
      return { ...current, scale: clamped }
    })
  }

  function applyScaleDelta (delta) {
    setSpec(current => {
      const clamped = clampScale(current.scale + delta, minScale)
      pendingScrollRef.current = computeScrollAfterScale(current.scale, clamped)
      return { ...current, scale: clamped }
    })
  }

  function getContentX (e) {
    const rect = contentRef.current.getBoundingClientRect()
    return e.clientX - rect.left + contentRef.current.scrollLeft
  }

  function handleTracksMouseMove (e) {
    /* Only show ghost when no button is held (not dragging items) */
    if (e.buttons !== 0) return
    setGhostX(getContentX(e))
  }

  function handleTracksMouseLeave () {
    setGhostX(null)
  }

  function handleTracksClick (e) {
    const x = getContentX(e)
    setPlayheadMs(utils.pixelsToMs(x, spec.scale))
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

    applyScaleDelta(delta)
  }

  const durationPx = utils.getPixelWidth(spec.duration ?? 0, spec.scale)
  const playheadX = playheadMs != null ? utils.getPixelWidth(playheadMs, spec.scale) : null

  return (
    <div className='Timeline'>
      <div
        className='Timeline-content'
        ref={contentRef}
        onWheel={handleWheel}
        onMouseMove={handleTracksMouseMove}
        onMouseLeave={handleTracksMouseLeave}
        onClick={handleTracksClick}
      >
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
          <Playhead x={ghostX} ghost />
        </div>
      </div>
      <TimelineFooter scale={spec.scale ?? 1} min={minScale} max={MAX_SCALE} frameRate={frameRate} onScale={applyScale} />
    </div>
  )
}