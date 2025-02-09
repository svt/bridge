import React from 'react'

import { Icon } from '../Icon'

import './style.css'

const ON_PLAY_ENUM = {
  'SELECT_NEXT_ITEM': '2',
  'PLAY_NEXT_ITEM': '1' 
}

export function RundownItemIndicatorsSection ({ item }) {
  return (
    <div className='RundownItemIndicatorsSection'>
      {
        item?.data?.onPlay === ON_PLAY_ENUM.SELECT_NEXT_ITEM &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='arrowDownSecondary' /></span>
      }
      {
        item?.data?.onPlay === ON_PLAY_ENUM.PLAY_NEXT_ITEM &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='arrowDownPlay' /></span>
      }
      {
        Object.keys(item?.issues ?? {}).length > 0 &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='warning' /></span>
      }
    </div>
  )
}
