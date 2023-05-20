import React from 'react'

import './style.css'

export function Popover ({ children, open = false, onClose = () => {} }) {
  const elRef = React.useRef()

  React.useEffect(() => {
    function close (e) {
      onClose()
    }
    window.addEventListener('blur', close)
    return () => {
      window.removeEventListener('blur', close)
    }
  }, [onClose])

  React.useEffect(() => {
    function close (e) {
      if (e.path.includes(elRef.current)) {
        return
      }
      onClose()
    }
    window.addEventListener('click', close, true)
    window.addEventListener('contextmenu', close, true)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('contextmenu', close)
    }
  }, [onClose])

  return (
    <div ref={elRef} className='Popover'>
      {
        open &&
        (
          <div className='Popover-content u-theme--light'>
            {children}
          </div>
        )
      }
    </div>
  )
}
