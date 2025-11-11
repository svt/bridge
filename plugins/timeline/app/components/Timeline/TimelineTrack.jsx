import React from 'react'

import './TimelineTrack.css'

import * as utils from './utils'

export function TimelineTrack ({ spec, item }) {
  return (
    <div className='TimelineTrack'>
      <div className='TimelineTrack-item' style={{
        backgroundColor: item?.color,
        width: `${utils.getPixelWidth(item.duration || 0, spec.scale)}px`,
        marginLeft: `${utils.getPixelWidth(item.delay || 0, spec.scale)}px`,
      }}>
        {item?.label}
      </div>
    </div>
  )
}