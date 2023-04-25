import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export function PreferencesShortcutsInput () {
  const [state] = React.useContext(SharedContext)

  return (
    <div className='PreferencesShortcutsInput'>
      <ol className='PreferencesShortcutsInput-list'>
        {
          Object.values(state?._shortcuts || {})
            .sort((a, b) => a.id > b.id)
            .map(shortcut => {
              return (
                <li key={shortcut.id} className='PreferencesShortcutsInput-listItem'>
                  <div className={`PreferencesShortcutsInput-description ${!(shortcut?.description) ? 'is-empty' : ''}`}>
                    {shortcut?.description || 'No description available'}
                  </div>
                  <div className='PreferencesShortcutsInput-trigger'>
                    {
                      (shortcut?.trigger || []).join(' + ')
                    }
                  </div>
                </li>
              )
            })
        }
      </ol>
    </div>
  )
}
