import React from 'react'
import icons from '../../assets/icons'

import './style.css'

export function Icon ({ name = 'placeholder', color = 'var(--base-color)' }) {
  return (
    <span
      className='Icon'
      style={{ '--Icon-color': color }}
      dangerouslySetInnerHTML={{ __html: icons[name] || icons.placeholder }}
    />
  )
}
