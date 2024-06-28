import React from 'react'
import { Popup } from '.'

import './confirm.css'

export function PopupConfirm ({ children, open, confirmText = 'Confirm', abortText = 'Abort', onChange = () => {} }) {
  return (
    <Popup open={open}>
      {children}
      <div className='PopupConfirm-actions'>
        <button className='Button' onClick={() => onChange(false)}>{abortText}</button>
        <button className='Button--accent' onClick={() => onChange(true)}>{confirmText}</button>
      </div>
    </Popup>
  )
}
