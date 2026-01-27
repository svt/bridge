import React from 'react'
import './style.css'

import * as api from '../../api'

export function PreferencesButtonInput ({ label, buttonText, command }) {
  async function handleButtonClick () {
    if (!command || typeof command !== 'string') {
      return
    }
    const bridge = await api.load()
    bridge.commands.executeCommand(command)
  }

  return (
    <div className='PreferencesButtonInput'>
      <label>{label}</label><br />
      <button className='Button' onClick={() => handleButtonClick()}>{buttonText}</button>
    </div>
  )
}
