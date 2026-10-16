import React from 'react'
import './style.css'

import { PopupConfirm } from '../Popup/confirm'

import * as api from '../../api'

export function PreferencesClearFilesInput ({ label }) {
  const [confirmIsOpen, setConfirmIsOpen] = React.useState(false)
  const [count, setCount] = React.useState()

  React.useEffect(() => {
    let bridge

    async function refresh () {
      const files = await bridge.files.list()
      setCount(files.length)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('file.change', refresh)
      refresh()
    }
    setup()

    return () => {
      bridge?.events.off('file.change', refresh)
    }
  }, [])

  async function handleCloseConfirm (confirm) {
    setConfirmIsOpen(false)
    if (!confirm) {
      return
    }

    const bridge = await api.load()
    bridge.files.clear()
  }

  return (
    <>
      <PopupConfirm confirmText='Proceed' abortText='Cancel' open={confirmIsOpen} onChange={confirm => handleCloseConfirm(confirm)}>
        <div className='u-heading--2'>{label}</div>
        This action is irreversible
      </PopupConfirm>
      <div className='PreferencesClearFilesInput'>
        <div className='PreferencesClearFilesInput-count'>
          {count ?? '-'} {count === 1 ? 'file' : 'files'}
        </div>
        <button className='Button Button--secondary' onClick={() => setConfirmIsOpen(true)}>
          {label}
        </button>
      </div>
    </>
  )
}
