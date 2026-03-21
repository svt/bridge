import React from 'react'

import { Settings as SettingsComponent } from '../components/Settings'
import { SettingsDisclaimer } from '../components/SettingsDisclaimer'

export function Settings () {
  return (
    <div className='View'>
      <SettingsComponent />
      <SettingsDisclaimer />
    </div>
  )
}