import React from 'react'
import { Popup } from '.'

import './confirm.css'

import * as modalStack from '../../utils/modals'

export function PopupConfirm ({ children, open, confirmText = 'Confirm', abortText = 'Abort', onChange = () => {} }) {
  React.useEffect(() => {
    if (!open) {
      return
    }

    function onClose () {
      onChange(false)
    }

    const id = modalStack.addToStack(onClose)
    return () => {
      modalStack.removeFromStack(id)
    }
  }, [open, onChange])

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
