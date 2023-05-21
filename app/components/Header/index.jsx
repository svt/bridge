import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Modal } from '../Modal'
import { Sharing } from '../Sharing'
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
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [sharingOpen, setSharingOpen] = React.useState(false)
  const [prefsOpen, setPrefsOpen] = React.useState(false)

  const connectionCount = Object.keys(shared?._connections || {}).length
  const isEditingLayout = shared?._connections?.[local?.id]?.isEditingLayout

  /**
   * Set the `isEditingLayout` toggle on
   * this client's object in the shared state
   * @param { Boolean } isEditing
   */
  function handleEdit (isEditing) {
    applyShared({
      _connections: {
        [local.id]: {
          isEditingLayout: isEditing
        }
      }
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
          <div className='Header-actionSection'>
            <button className='Header-button Header-sharingBtn' onClick={() => setSharingOpen(true)}>
              <Icon name='person' />
              {connectionCount || 0}
            </button>
            <Sharing open={sharingOpen} onClose={() => setSharingOpen(false)} />
          </div>
          <button className={`Header-button Header-editBtn ${isEditingLayout ? 'is-active' : ''}`} onClick={() => handleEdit(!isEditingLayout)}>
            <Icon name='edit' color={isEditingLayout ? 'var(--base-color--accent1)' : 'var(--base-color)'} />
          </button>
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)}>
            <Icon name='preferences' />
          </button>
        </div>
      </header>
    </>
  )
}
