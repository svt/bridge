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
 * @type { number }
 */
const OPEN_THRESHOLD_MS = 100

/**
 * The default width of
 * a context menu in pixels,
 * 
 * will be used unless a new width
 * is specified as a property
 * to the component
 * 
 * @type { number }
 */
const DEFAULT_WIDTH_PX = 150

export const ContextMenu = ({ x, y, width = DEFAULT_WIDTH_PX, children, onClose = () => {} }) => {
  const elRef = React.useRef()
  const openTimestampRef = React.useRef()

  const [direction, setDirection] = React.useState('down')

  React.useEffect(() => {
    openTimestampRef.current = Date.now()
  }, [x, y])

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
    window.addEventListener('contextmenu', closeContext)
    return () => {
      window.removeEventListener('blur', closeContext)
      window.removeEventListener('click', closeContext)
      window.removeEventListener('contextmenu', closeContext)
    }
  }, [x, y, onClose])

  /*
  Make sure that the menu open in the direction
  where it's got the most free space
  */
  React.useEffect(() => {
    const viewportHeight = window.innerHeight
    if (y > viewportHeight / 2) {
      setDirection('up')
    } else {
      setDirection('down')
    }
  }, [y])

  return (
    <>
      {
        createPortal(
          <div
            ref={elRef}
            className={`ContextMenu u-theme--light ContextMenu--${direction}`}
            style={{ top: y, left: x, width: width }}
          >
            {children}
          </div>,
          document.body
        )
      }
    </>
  )
}
