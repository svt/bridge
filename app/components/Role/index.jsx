import React from 'react'

import * as api from '../../api'

import { Popover } from '../Popover'
import { PopupConfirm } from '../Popup/confirm'

import './style.css'

export function Role ({ currentRole = 0, open, onClose = () => {} }) {
  const [popupIsOpen, setPopupIsOpen] = React.useState()

  async function handleAssumeMain (value) {
    if (value) {
      const bridge = await api.load()
      const id = bridge.client.getIdentity()
      bridge.client.setRole(id, bridge.client.ROLES.main)
    }
    setPopupIsOpen(false)
  }

  return (
    <>
      <PopupConfirm open={popupIsOpen} confirmText='Become main' abortText='Cancel' onChange={value => handleAssumeMain(value)}>
        <div className='u-heading--2'>Become main</div>
        This will turn the current<br />main client into satellite mode
      </PopupConfirm>
      <Popover open={open} onClose={onClose}>
        <div className='Role u-theme--light'>
          <div className='Role-content'>
            Only the main client's selections can be triggered by the api
            {
              currentRole === 1
                ? <div className='Role-status'>This is the main client</div>
                : (
                  <button className='Button Button--secondary u-width--100pct Sharing-copyBtn' onClick={() => setPopupIsOpen(true)}>
                    Become main
                  </button>
                )
            }
          </div>
        </div>
      </Popover>
    </>
  )
}
