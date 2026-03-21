import React from 'react'
import './style.css'

export function NotConfigured () {
  return (
    <div className='NotConfigured'>
      <div className='NotConfigured-centered'>
        <h1>Not configured</h1>
        <div className='NotConfigured-description'>
          Open the plugin settings to<br />configure a provider and API key
        </div>
      </div>
    </div>
  )
}
