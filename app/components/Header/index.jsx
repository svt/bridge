import React from 'react'

import { SharedContext } from '../../sharedContext'

import { Modal } from '../Modal'
import { Preferences } from '../Preferences'

import './style.css'

export function Header ({ title = 'Bridge' }) {
  const [shared] = React.useContext(SharedContext)
  const [prefsOpen, setPrefsOpen] = React.useState(false)

  const connections = shared?.connections?.length

  return (
    <>
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <header className='Header'>
        <div />
        <div className='Header-center'>
          {title}
        </div>
        <div className='Header-block'>
          <div className='Header-connections'>
            {connections || 0}
          </div>
          <button className='Header-button Header-editBtn' />
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)} />
        </div>
      </header>
    </>
  )
}
