import React from 'react'

import { useDraggable } from '../../hooks/useDraggable'

import './style.css'

export function Modal ({ children, open, size = 'large', onClose = () => {}, draggable = false, shade = true }) {
  const handleRef = React.useRef()
  const [offset] = useDraggable(handleRef.current)

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
    <div className={`Modal Modal--${size} u-theme--light ${open ? 'is-open' : ''} ${draggable ? 'is-draggable' : ''} ${!shade ? 'has-noShade' : ''}`}>
      <div className='Modal-wrapper' style={{ transform: `translate(${offset[0]}px, ${offset[1]}px)` }}>
        <div className='Modal-content'>
          {
            draggable && <div ref={handleRef} className='Modal-handle'>•••</div>
          }
          {children}
        </div>
      </div>
    </div>
  )
}
