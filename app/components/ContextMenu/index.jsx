import React from 'react'
import { createPortal } from 'react-dom'

import './style.css'

/**
 * A threshold for how long the context menu has
 * to have been open before an event can close it
 * 
 * This it to prevent the same event to
 * both open and close a context menu
 * 
 * @type { Number }
 */
const OPEN_THRESHOLD_MS = 100

export const ContextMenu = ({ x, y, children, onClose = () => {} }) => {
  const elRef = React.useRef()
  const openTimestampRef = React.useRef()

  React.useEffect(() => {
    openTimestampRef.current = Date.now()
  }, [])

  React.useEffect(() => {
    function closeContext () {
      /*
      Check how long the context menu has been opened
      to prevent it from closing on the same event that
      opened it
      */
      if (Date.now() - openTimestampRef.current <= OPEN_THRESHOLD_MS) {
        return
      }
      onClose()
    }

    window.addEventListener('blur', closeContext)
    window.addEventListener('click', closeContext)
    window.addEventListener('contextmenu', closeContext, true)
    return () => {
      window.removeEventListener('blur', closeContext)
      window.removeEventListener('click', closeContext)
      window.removeEventListener('contextmenu', closeContext)
    }
  }, [onClose])

  return (
    <>
      {
        createPortal(
          <div ref={elRef} className='ContextMenu u-theme--light' style={{ top: y, left: x }}>
            {children}
          </div>,
          document.body
        )
      }
    </>
  )
}
