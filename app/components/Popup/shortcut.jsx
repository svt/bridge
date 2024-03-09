import React from 'react'
import { Popup } from '.'

import './shortcut.css'

import * as shortcuts from '../../utils/shortcuts'

export function PopupShortcut ({ open, shortcut, onChange = () => {} }) {
  const [trigger, setTrigger] = React.useState(shortcut?.trigger)

  React.useEffect(() => {
    setTrigger(shortcut?.trigger)
  }, [shortcut?.trigger])

  React.useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown () {
      setTrigger(shortcuts.getPressed())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <Popup open={open}>
      <div className='PopupShortcut-description'>
        Press a key combination
      </div>
      <div className='PopupShortcut-preview'>
        {
          (trigger || []).join(' + ')
        }
      </div>
      <div className='PopupShortcut-actions'>
        <button className='Button--secondary' onClick={() => onChange(undefined)}>Cancel</button>
        <button className='Button--secondary' onClick={() => onChange(-1)}>Reset</button>
        <button className='Button--primary' onClick={() => onChange(trigger)}>OK</button>
      </div>
    </Popup>
  )
}
