import React from 'react'
import arrowDown from './arrow-down.svg'

import './style.css'

export function Icon ({ name = 'placeholder', color = 'var(--base-color)' }) {
  return (
    <span
      className='Icon'
      style={{ '--Icon-color': color }}
      dangerouslySetInnerHTML={{ __html: arrowDown || '' }}
    />
  )
}
