import React from 'react'

import { useDraggable } from '../../hooks/useDraggable'

import './style.css'

import * as modalStack from '../../utils/modals'
import { createPortal } from 'react-dom'

export function Modal ({ children, open, size = 'large', onClose = () => {}, draggable = false, shade = true }) {
  const elRef = React.useRef()
  const handleRef = React.useRef()

  const [offset] = useDraggable(handleRef.current)

  React.useEffect(() => {
    if (!open) {
      return
    }

    function handleClose () {
      if (typeof onClose !== 'function') {
        return
      }
      onClose()
    }

    const id = modalStack.addToStack(handleClose)
    return () => {
      modalStack.removeFromStack(id)
    }
  }, [open])

  return (
    <>
      {
        createPortal(
          (
            <div ref={elRef} className={`Modal Modal--${size} u-theme--light ${open ? 'is-open' : ''} ${draggable ? 'is-draggable' : ''} ${!shade ? 'has-noShade' : ''}`}>
              <div className='Modal-wrapper' style={{ transform: `translate(${offset[0]}px, ${offset[1]}px)` }}>
                <div className='Modal-content'>
                  {
                    draggable && <div ref={handleRef} className='Modal-handle'>•••</div>
                  }
                  {children}
                </div>
              </div>
            </div>
          ),
          document.body
        )
      }
    </>
  )
}
