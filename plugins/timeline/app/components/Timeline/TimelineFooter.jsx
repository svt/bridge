import React from 'react'

import './TimelineFooter.css'

export function TimelineFooter ({ scale = 1, min, max, frameRate, onScale }) {
  return (
    <div className='TimelineFooter'>
      {frameRate != null && (
        <span className='TimelineFooter-frameRate'>{frameRate} fps</span>
      )}
      <div className='TimelineFooter-zoom'>
        <span className='TimelineFooter-zoom-label'>
          {Math.round(scale * 100)}%
        </span>
        <input
          className='TimelineFooter-zoom-slider'
          type='range'
          min={min}
          max={max}
          step='0.01'
          value={scale}
          onChange={e => onScale?.(parseFloat(e.target.value))}
        />
      </div>
    </div>
  )
}
