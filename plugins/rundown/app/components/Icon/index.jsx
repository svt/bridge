import React from 'react'
import icons from '../../assets/icons'

import './style.css'

export function Icon ({ name = 'placeholder' }) {
  return (
    <span className='Icon' dangerouslySetInnerHTML={{ __html: icons[name] || icons.placeholder }} />
  )
}
