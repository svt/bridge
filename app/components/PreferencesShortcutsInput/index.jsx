import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

import { Icon } from '../Icon'
import { PopupShortcut } from '../Popup/shortcut'

import * as api from '../../api'

export function PreferencesShortcutsInput () {
  const [state] = React.useContext(SharedContext)
  const [popupShortcut, setPopupShortcut] = React.useState()

  async function handleNewTrigger (newTrigger, shortcut) {
    setPopupShortcut(undefined)
    const bridge = await api.load()

    if (!newTrigger) {
      return
    }

    /*
    Clear the override if it is reset or
    the new trigger is the same as the default one
    */
    if (newTrigger === -1 || newTrigger.sort().join(',') === shortcut?.trigger?.sort().join(',')) {
      bridge.shortcuts.clearShortcutOverride(shortcut.id)
      return
    }

    /*
    Register a new shortcut override
    */
    if (newTrigger) {
      bridge.shortcuts.registerShortcutOverride(shortcut.id, {
        trigger: newTrigger
      })
      return
    }
  }

  return (
    <div className='PreferencesShortcutsInput'>
      <PopupShortcut open={!!popupShortcut} shortcut={popupShortcut?.merged} onChange={(newTrigger, shortcut) => handleNewTrigger(newTrigger, popupShortcut?.shortcut)} />
      <ol className='PreferencesShortcutsInput-list'>
        {
          Object.values(state?._shortcuts || {})
            .sort((a, b) => a.id > b.id)
            .map(shortcut => {
              const override = state?._userDefaults?.shortcuts?.[shortcut.id] || {}

              return (
                <li key={shortcut.id} className={`PreferencesShortcutsInput-listItem ${override?.trigger ? 'has-changed' : ''}`}>
                  <div className={`PreferencesShortcutsInput-description ${!(shortcut?.description) ? 'is-empty' : ''}`}>
                    {shortcut?.description || 'No description available'}
                  </div>
                  <div className='PreferencesShortcutsInput-trigger' onClick={() => setPopupShortcut({ shortcut, merged: { ...shortcut, ...override } })}>
                    {
                      (override?.trigger || shortcut?.trigger || []).join(' + ')
                    }
                    <span className='PreferencesShortcutsInput-icon'>
                      <Icon name='editDetail' />
                    </span>
                  </div>
                </li>
              )
            })
        }
      </ol>
    </div>
  )
}
