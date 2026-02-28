import React from 'react'
import './style.css'

import { Notification } from '../Notification'

export function PreferencesWarningInput ({ title, description }) {
  return (
    <div className='PreferencesWarningInput'>
      <Notification icon='warning' title={title} description={description} type='warning' transparent />
    </div>
  )
}
