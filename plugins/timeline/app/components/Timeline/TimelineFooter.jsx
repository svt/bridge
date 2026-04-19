import React from 'react'
import bridge from 'bridge'

import { Icon } from '../../../../../app/components/Icon'

import './TimelineFooter.css'

export function TimelineFooter ({ timelineId, scale = 1, min, max, frameRate, timelineOptions = [], lockedId, isFloated = false, onLockChange, onScale }) {
  
  function handlePlay () {
    bridge.items.playItem(timelineId)
  }

  function handleStop () {
    bridge.items.stopItem(timelineId)
  }
  
  return (
    <div className='TimelineFooter'>
      <div className='TimelineFooter-left'>
        <select
          className='Select--small'
          value={lockedId ?? ''}
          onChange={e => onLockChange?.(e.target.value)}
        >
          {!isFloated && <option value=''>Follow selection</option>}
          {timelineOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </select>
        {frameRate != null && (
          <span className='TimelineFooter-frameRate'>{frameRate} fps</span>
        )}
      </div>
      <div className='TimelineFooter-right'>
        {
          timelineId &&
          (
            <>
              <div className='TimelineFooter-controls'>
                <button className='TimelineFooter-controlButton' onClick={() => handlePlay()}>
                  <Icon name='play' />
                </button>
                <button className='TimelineFooter-controlButton' onClick={() => handleStop()}>
                  <Icon name='stop' />
                </button>
              </div>   
            </>
          )
        }
        <span className='TimelineFooter-zoomLabel'>
          {Math.round(scale * 100)}%
        </span>
        <input
          className='TimelineFooter-zoomSlider'
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
