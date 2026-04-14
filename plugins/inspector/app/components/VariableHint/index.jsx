import React from 'react'
import './style.css'

import { Icon } from '../../../../../app/components/Icon'

export function VariableHint ({ onClick = () => {} }) {
  return (
    <div className='VariableHint' data-hint='Insert variable' data-hint-alignment='right' onClick={() => onClick()}>
      <Icon name='variable' />
    </div>
  )
}
