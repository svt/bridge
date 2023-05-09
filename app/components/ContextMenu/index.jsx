import React from 'react'
import './style.css'

export const ContextMenu = ({ x, y, children, onClose = () => {} }) => {
  const elRef = React.useRef()

  React.useEffect(() => {
    function closeContext () {
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
    <div ref={elRef} className='ContextMenu u-theme--light' style={{ top: y, left: x }}>
      {children}
    </div>
  )
}
