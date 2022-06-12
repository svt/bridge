import React from 'react'
import './style.css'

function getEnvironment () {
  if (window.navigator.userAgent.includes('Bridge')) {
    return 'electron'
  }
  return 'web'
}

export function PreferencesVersionInput () {
  return (
    <div className='PreferencesVersionInput'>
      {window.APP.version || 'Unknown'} ({getEnvironment()})
    </div>
  )
}
