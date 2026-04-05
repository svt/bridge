import React from 'react'

import { Icon } from '../../../../../app/components/Icon'

import './style.css'

export function NoTimelineSelected () {
  return (
    <div className='NoTimelineSelected'>
      <div className='NoTimelineSelected-content'>
        <Icon name='timeline' />
        <div>
          No timeline selected
        </div>
      </div>
    </div>
  )
}