import React from 'react'
import './style.css'

import { Modal } from '../Modal'
import { Preferences } from '../Preferences'

export function Header ({ title = 'Bridge' }) {
  const [prefsOpen, setPrefsOpen] = React.useState(false)

  return (
    <>
      <Modal open={prefsOpen}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <header className='Header'>
        <div />
        <div className='Header-center'>
          {title}
        </div>
        <div>
          <button className='Header-button Header-editBtn' />
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)} />
        </div>
      </header>
    </>
  )
}
