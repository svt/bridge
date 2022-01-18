import React from 'react'

import './style.css'

export function Modal ({ children, open, onClose = () => {} }) {
  /*
  Trigger the onClose callback
  if the escape key is pressed
  */
  React.useEffect(() => {
    function onKeyUp (e) {
      if (e.key !== 'Escape') return
      onClose()
    }

    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return (
    <div className={`Modal u-theme--light ${open ? 'is-open' : ''}`}>
      <div className='Modal-content'>
        {children}
      </div>
    </div>
  )
}
