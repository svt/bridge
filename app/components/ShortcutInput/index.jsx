import React from 'react'

import './style.css'

import * as shortcuts from '../../utils/shortcuts'

export function ShortcutInput ({ disabled, trigger, onChange = () => {} }) {
  React.useEffect(() => {
    if (disabled) {
      return
    }

    function onKeyDown (e) {
      if (e.key === 'Escape') {
        return
      }
      e.preventDefault()
      onChange(shortcuts.getPressed())
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [disabled])

  function hasTrigger () {
    return trigger && trigger?.length > 0 && trigger?.[0]
  }

  return (
    <div className={`ShortcutInput ${disabled ? 'ShortcutInput--disabled' : ''}`}>
      {
        !hasTrigger() && !disabled
          ? <span className='ShortcutInput-placeholder'>Press any combination</span>
          : (trigger || []).join(' + ')
      }
    </div>
  )
}
