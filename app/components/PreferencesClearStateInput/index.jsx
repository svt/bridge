import React from 'react'
import './style.css'

import { PopupConfirm } from '../Popup/confirm'

export function PreferencesClearStateInput ({ label, onChange = () => {} }) {
  const [confirmIsOpen, setConfirmIsOpen] = React.useState(false)

  function handleCloseConfirm (confirm) {
    if (confirm) {
      onChange({ $delete: true })
    }
    setConfirmIsOpen(false)
  }

  return (
    <>
      <PopupConfirm confirmText='Proceed' abortText='Cancel' open={confirmIsOpen} onChange={confirm => handleCloseConfirm(confirm)}>
        <div className='u-heading--2'>{label}</div>
        This action is irreversible
      </PopupConfirm>
      <div className='PreferencesClearStateInput'>
        <button className='Button Button--secondary' onClick={() => setConfirmIsOpen(true)}>
          {label}
        </button>
      </div>
    </>
  )
}
