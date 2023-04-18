import React from 'react'
import './style.css'

import { Frame } from '../Frame'

export function PreferencesFrameInput ({ label, uri }) {
  return (
    <div className='PreferencesFrameInput'>
      <Frame src={uri} />
    </div>
  )
}
