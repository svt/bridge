import React from 'react'

import { Icon } from '../Icon'

import './style.css'

const ACTIONS_ENUM = {
  'STOP_ON_END': '3',
  'SELECT_NEXT_ITEM': '2',
  'PLAY_NEXT_ITEM': '1' 
}

export function RundownItemIndicatorsSection ({ item }) {
  return (
    <div className='RundownItemIndicatorsSection'>
      {
        (
          item?.data?.onPlay === ACTIONS_ENUM.SELECT_NEXT_ITEM ||
          item?.data?.onEnd === ACTIONS_ENUM.SELECT_NEXT_ITEM
        )
        &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='arrowDownSecondary' /></span>
      }
      {
        (
          item?.data?.onPlay === ACTIONS_ENUM.PLAY_NEXT_ITEM ||
          item?.data?.onEnd === ACTIONS_ENUM.PLAY_NEXT_ITEM
        ) &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='arrowDownPlay' /></span>
      }
      {
        (
          item?.data?.onEnd === ACTIONS_ENUM.STOP_ON_END
        ) &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='stopOnEnd' /></span>
      }
      {
        Object.keys(item?.issues ?? {}).length > 0 &&
          <span className='RundownItemIndicatorsSection-icon'><Icon name='warning' /></span>
      }
    </div>
  )
}
