import React from 'react'
import './style.css'

import { Icon } from '../Icon'

import * as api from '../../api'

export function PreferencesButtonInput ({ label, buttonText, buttonIsLoading, command }) {
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
      <div className='PreferencesButtonInput-wrapper'>
        <button className='Button' onClick={() => handleButtonClick()}>{buttonText}</button>
        {
          buttonIsLoading &&
          (
            <div className='PreferencesButtonInput-loader'>
              <Icon name='spinner' />
            </div>
          )
        }
      </div>
    </div>
  )
}
