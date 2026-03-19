import React from 'react'

import './TimelineTrack.css'

import * as utils from './utils'

const MIN_DURATION_MS = 100
const MIN_DELAY_MS = 0

export function TimelineTrack ({ spec, item, onChange }) {
  const [localItem, setLocalItem] = React.useState(item)
  const isDragging = React.useRef(false)
  const dragValuesRef = React.useRef({ delay: 0, duration: 0 })

  React.useEffect(() => {
    if (!isDragging.current) {
      setLocalItem(item)
    }
  }, [item])

  function handleBodyMouseDown (e) {
    if (e.button !== 0) return
    e.preventDefault()
    isDragging.current = true
    const startX = e.clientX
    const startDelay = localItem.delay || 0
    dragValuesRef.current = { delay: startDelay, duration: localItem.duration || 0 }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const newDelay = Math.max(MIN_DELAY_MS, Math.round(startDelay + dMs))
      dragValuesRef.current.delay = newDelay
      setLocalItem(cur => ({ ...cur, delay: newDelay }))
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
    dragValuesRef.current = { delay: localItem.delay || 0, duration: startDuration }

    function onMouseMove (e) {
      const dMs = utils.pixelsToMs(e.clientX - startX, spec.scale)
      const newDuration = Math.max(MIN_DURATION_MS, Math.round(startDuration + dMs))
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