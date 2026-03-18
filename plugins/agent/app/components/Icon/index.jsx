import React from 'react'
import icons from '../../assets/icons'

import './style.css'

export function Icon ({ name = 'placeholder', color = 'var(--base-color)', preserveColors = false }) {
  return (
    <span className={`Icon ${preserveColors ? 'Icon--preserveColors' : ''}`} style={{ '--icon-color': color }} dangerouslySetInnerHTML={{ __html: icons[name] }} />
  )
}
