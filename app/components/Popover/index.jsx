import React from 'react'

import './style.css'

const ALIGNMENT = {
  center: '-50%',
  left: '0',
  right: '-100%'
}

const DIRECTION = {
  up: 'calc(-100% - 10px)',
  down: '0'
}

export function Popover ({ children, open = false, direction = 'down', alignment = 'center', onClose = () => {} }) {
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
      if (e.composedPath().includes(elRef.current)) {
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
    <div ref={elRef} className={`Popover Popover--${direction} Popover--${alignment}`}>
      {
        open &&
        (
          <div className='Popover-content u-theme--light' style={{
            transform: `translate(${ALIGNMENT[alignment]}, ${DIRECTION[direction]})`
          }}>
            {children}
          </div>
        )
      }
    </div>
  )
}
