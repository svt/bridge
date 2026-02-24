import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { Modal } from '../Modal'
import { AppMenu } from '../AppMenu'
import { Palette } from '../Palette'
import { Preferences } from '../Preferences'

import { Icon } from '../Icon'

import * as api from '../../api'
import * as windowUtils from '../../utils/window'

import './style.css'

const DEFAULT_TITLE = 'Unnamed'

function handleReload () {
  window.location.reload()
}

export function Header ({ title = DEFAULT_TITLE, features }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [stayOnTop, setStayOnTop] = React.useState()

  const [paletteIsOpen, setPaletteIsOpen] = React.useState(false)
  const [prefsOpen, setPrefsOpen] = React.useState(false)

  const isEditingLayout = shared?._connections?.[local?.id]?.isEditingLayout

  /*
  Listen for shortcuts
  to open the palette
  */
  React.useEffect(() => {
    console.log('[Header] Registering')
    function onShortcut (shortcut) {
      console.log('[Header] Got shortcut', shortcut)
      switch (shortcut) {
        case 'openPalette':
          setPaletteIsOpen(true)
          break
        case 'openSettings':
          setPrefsOpen(true)
          break
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

  function featureShown (feature) {
    if (!Array.isArray(features)) {
      return true
    }
    return features.includes(feature)
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

  function handleStayOnTopChange (newValue) {
    windowUtils.setStayOnTop(newValue)
    setStayOnTop(newValue)
  }

  return (
    <>
      <Modal open={prefsOpen} onClose={() => setPrefsOpen(false)}>
        <Preferences onClose={() => setPrefsOpen(false)} />
      </Modal>
      <Palette open={paletteIsOpen} onClose={() => handlePaletteClose()} />
      <header
        className={`
          Header
          ${windowUtils.isMacOS() && windowUtils.isElectron() ? 'has-leftMargin' : ''}
          ${windowUtils.isWindows() && windowUtils.isElectron() ? 'has-rightMargin' : ''}
        `}
        onDoubleClick={() => windowUtils.toggleMaximize()}
      >
        {
          (windowUtils.isWindows() && windowUtils.isElectron())
          ? (
            <>
              <div className='Header-title'>
                <AppMenu />
              </div>
              <div className='Header-center'>
                { featureShown('title') && title }
                {
                  featureShown('title') && shared?._hasUnsavedChanges &&
                  <span className='Header-edited'> — edited</span>
                }
              </div>
            </>
          )
          : (
            <>
              <div className='Header-title'>
                { featureShown('title') && title }
                {
                  featureShown('title') && shared?._hasUnsavedChanges &&
                  <span className='Header-edited'> — edited</span>
                }
              </div>
              <div className='Header-center' />
            </>
          )
        }
        <div className='Header-block'>
          {
            featureShown('stayOnTop') && windowUtils.isElectron() &&
            (
              <button className='Header-button' onClick={() => handleStayOnTopChange(!stayOnTop)} title='Toggle stay on top'>
                <Icon name={stayOnTop ? 'stayOnTopOn' : 'stayOnTopOff'} />
              </button>
            )
          }
          {
            featureShown('palette') &&
            (
              <button className='Header-button' onClick={() => handlePaletteOpen()} title='Open palette'>
                <Icon name='search' />
              </button>
            )
          }
          {
            featureShown('reload') &&
            (
              <button className='Header-button' onClick={() => handleReload()} title='Reload'>
                <Icon name='reload' />
              </button>
            )
          }
          {
            featureShown('editLayout') &&
            (
              <button className={`Header-button ${isEditingLayout ? 'is-active' : ''}`} onClick={() => handleEdit(!isEditingLayout)} title='Edit layout'>
                <Icon name='edit' color={isEditingLayout ? 'var(--base-color--accent1)' : 'var(--base-color)'} />
              </button>
            )
          }
          {
            featureShown('preferences') &&
            (
              <button className='Header-button Header-preferencesBtn' onClick={() => setPrefsOpen(true)} title='Preferences'>
                <Icon name='preferences' />
              </button>
            )
          }
        </div>
      </header>
    </>
  )
}
