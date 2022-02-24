import React from 'react'
import { Popup } from '.'

import './confirm.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export function PopupConfirm ({ children, open, confirmText = 'Confirm', abortText = 'Abort', onChange = () => {} }) {
  return (
    <Popup open={open}>
      {children}
      <div className='PopupConfirm-actions'>
        <button className='Button--secondary' onClick={() => onChange(false)}>{abortText}</button>
        <button className='Button--primary' onClick={() => onChange(true)}>{confirmText}</button>
      </div>
    </Popup>
  )
}
