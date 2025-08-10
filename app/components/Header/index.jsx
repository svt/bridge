import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Role } from '../Role'
import { Modal } from '../Modal'
import { Palette } from '../Palette'
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

function handleReload () {
  window.location.reload()
}

async function handleMaximize () {
  if (!isElectron()) {
    return
  }
  const bridge = await api.load()
  bridge.commands.executeCommand('window.toggleMaximize')
}

export function Header ({ title = 'Bridge', onOpenPalette = () => {} }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [paletteIsOpen, setPaletteIsOpen] = React.useState(false)
  const [sharingOpen, setSharingOpen] = React.useState(false)
  const [prefsOpen, setPrefsOpen] = React.useState(false)
  const [roleOpen, setRoleOpen] = React.useState(false)

  const connectionCount = Object.keys(shared?._connections || {}).length
  const isEditingLayout = shared?._connections?.[local?.id]?.isEditingLayout
  const role = shared?._connections?.[local.id]?.role

  /*
  Listen for shortcuts
  to open the palette
  */
  React.useEffect(() => {
    function onShortcut (shortcut) {
      switch (shortcut) {
        case 'openPalette':
          setPaletteIsOpen(true)
      }
    }

    async function setup () {
      const bridge = await api.load()
      bridge.events.on('shortcut', onShortcut)
    }
    setup()

    return () => {
      async function teardown () {
        const bridge = await api.load()
        bridge.events.off('shortcut', onShortcut)
      }
      teardown()
    }
  }, [])

  /**
   * Close the palette
   */
  function handlePaletteClose () {
    setPaletteIsOpen(false)
  }

  /**
   * Open the palette
   */
  function handlePaletteOpen () {
    setPaletteIsOpen(true)
  }

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

  return (
    <>
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <Palette open={paletteIsOpen} onClose={() => handlePaletteClose()} />
      <header className={`Header ${isMacOS() && isElectron() ? 'has-leftMargin' : ''}`} onDoubleClick={() => handleMaximize()}>
        <div>
          { title }
        </div>
        <div className='Header-center'></div>
        <div className='Header-block'>
          <div className='Header-actionSection'>
            <button className={`Header-button Header-roleBtn ${role === 1 ? 'is-main' : ''}`} onClick={() => setRoleOpen(true)}>
              {role === 1 ? 'Main' : 'Satellite'}
            </button>
            <Role currentRole={role} open={roleOpen} onClose={() => setRoleOpen(false)} />
          </div>
          <div className='Header-actionSection'>
            <button className='Header-button Header-sharingBtn' onClick={() => setSharingOpen(true)}>
              <Icon name='person' />
              {connectionCount || 0}
            </button>
            <Sharing open={sharingOpen} onClose={() => setSharingOpen(false)} />
          </div>
          <button className='Header-button Header-editBtn' onClick={() => handlePaletteOpen()} title='Open palette'>
            <Icon name='search' />
          </button>
          <button className='Header-button Header-editBtn' onClick={() => handleReload()} title='Reload'>
            <Icon name='reload' />
          </button>
          <button className={`Header-button Header-editBtn ${isEditingLayout ? 'is-active' : ''}`} onClick={() => handleEdit(!isEditingLayout)} title='Edit layout'>
            <Icon name='edit' color={isEditingLayout ? 'var(--base-color--accent1)' : 'var(--base-color)'} />
          </button>
          <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)} title='Preferences'>
            <Icon name='preferences' />
          </button>
        </div>
      </header>
    </>
  )
}
