import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Modal } from '../Modal'
import { Preferences } from '../Preferences'

import { Icon } from '../Icon'

import * as api from '../../api'

import './style.css'

function isMacOS () {
  return window.APP.platform === 'darwin'
}

function isElectron () {
  return window.navigator.userAgent.includes('Bridge')
}

export function Header ({ title = 'Bridge' }) {
  const [shared,, applySharedKey] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [prefsOpen, setPrefsOpen] = React.useState(false)

  const connections = shared?._connections?.length

  /**
   * Set the `isEditingLayout` toggle on
   * this client's object in the shared state
   * @param { Boolean } isEditing
   */
  function handleEdit (isEditing) {
    applySharedKey(local.id, {
      isEditingLayout: isEditing
    })
  }

  async function handleMaximize () {
    if (!isElectron()) {
      return
    }
    const bridge = await api.load()
    bridge.commands.executeCommand('window.toggleMaximize')
  }

  return (
    <>
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <header className={`Header ${isMacOS() && isElectron() ? 'has-leftMargin' : ''}`} onDoubleClick={() => handleMaximize()}>
        <div>
          { title }
        </div>
        <div className='Header-center'></div>
        <div className='Header-block'>
          <div className='Header-connections'>
            <div className='Header-connectionsIcon'>
              <Icon name='person' />
            </div>
            {connections || 0}
          </div>
          <button className='Header-button Header-editBtn' onClick={() => handleEdit(!shared[local.id]?.isEditingLayout)}>
            <Icon name='edit' />
          </button>
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)}>
            <Icon name='preferences' />
          </button>
        </div>
      </header>
    </>
  )
}
