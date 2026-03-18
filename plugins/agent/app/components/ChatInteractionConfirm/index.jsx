import React from 'react'
import bridge from 'bridge'

import './style.css'
import { Icon } from '../Icon'

export function ChatInteractionConfirm ({ type, text, command, onSend = () => {}, onRender = () => {} }) {
  const [status, setStatus] = React.useState()
  
  function handleConfirm (confirmed) {
    setStatus(confirmed)
    bridge.commands.executeRawCommand(command, confirmed)
  }

  return (
    <div className={`ChatInteractionConfirm ${status !== undefined && 'ChatInteractionConfirm--done'}`}>
      <div className='ChatInteractionConfirm-content'>
        {
          status === true &&
          (
            <div className='ChatInteractionConfirm-icon'>
              <Icon name='success' preserveColors />
            </div>
          )
        }
        {
          status === false &&
          (
            <div className='ChatInteractionConfirm-icon'>
              <Icon name='error' preserveColors />
            </div>
          )
        }
        {text}
      </div>
      {
        status === undefined &&
        (
        <div className='ChatInteractionConfirm-actions'>
          <button className='Button Button--accent ChatInteractionConfirm-button' onClick={() => handleConfirm(true)}>
            Allow
          </button>
          <button className='Button ChatInteractionConfirm-button' onClick={() => handleConfirm(false)}>
            Deny
          </button>
        </div>
        )
      }
    </div>
  )
}