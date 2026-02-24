import React from 'react'
import { Popup } from '.'

import './shortcut.css'

import * as shortcuts from '../../utils/shortcuts'
import * as modalStack from '../../utils/modals'

export function PopupShortcut ({ open, shortcut, onChange = () => {} }) {
  const [trigger, setTrigger] = React.useState(shortcut?.trigger)

  React.useEffect(() => {
    setTrigger(shortcut?.trigger)
  }, [shortcut?.trigger])

  React.useEffect(() => {
    if (!open) {
      return
    }

    function onClose () {
      onChange(undefined)
    }

    shortcuts.disable()
    const id = modalStack.addToStack(onClose)
    return () => {
      shortcuts.enable()
      modalStack.removeFromStack(id)
    }
  }, [open])

  React.useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown (e) {
      if (e.key === 'Escape') {
        return
      }
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
        <button className='Button' onClick={() => onChange(undefined)}>Cancel</button>
        <button className='Button' onClick={() => onChange(-1)}>Reset</button>
        <button className='Button--accent' onClick={() => onChange(trigger)}>OK</button>
      </div>
    </Popup>
  )
}
