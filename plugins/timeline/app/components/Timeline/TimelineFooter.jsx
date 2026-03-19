import React from 'react'

import './TimelineFooter.css'

export function TimelineFooter ({ scale = 1, min, max, frameRate, timelineOptions = [], lockedId, onLockChange, onScale }) {
  return (
    <div className='TimelineFooter'>
      <div className='TimelineFooter-left'>
        {frameRate != null && (
          <span className='TimelineFooter-frameRate'>{frameRate} fps</span>
        )}
        <select
          className='Select--small'
          value={lockedId ?? ''}
          onChange={e => onLockChange?.(e.target.value)}
        >
          <option value=''>Follow selection</option>
          {timelineOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
      </div>
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
