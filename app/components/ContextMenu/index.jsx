import React from 'react'
import { createPortal } from 'react-dom'

import './style.css'

const DIRECTION = Object.freeze({
  UP: 'up',
  DOWN: 'down'
})

const VERTICAL_MARGIN_TO_WINDOW_EDGE_PX = 5
const VERTICAL_DIRECTION_SHIFT_PX = 20

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

export const ContextMenu = ({ x: _x, y: _y, width = DEFAULT_WIDTH_PX, children, onClose = () => {} }) => {
  const elRef = React.useRef()
  const openTimestampRef = React.useRef()

  const [direction, setDirection] = React.useState(DIRECTION.DOWN)
  const [x, setX] = React.useState(_x)
  const [y, setY] = React.useState(_y)

  React.useEffect(() => {
    openTimestampRef.current = Date.now()
  }, [x, y])

  /*
  Avoid clipping the context menu as much as possible
  by shifting it based on the window size and the menus
  direction
  */
  React.useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (!entries[0]) {
        return
      }

      if (!elRef.current) {
        return
      }
      const bounds = elRef.current.getBoundingClientRect()

      /*
      Move it down from the top
      */
      if (direction === DIRECTION.UP && y - bounds.height < 0) {
        setY(bounds.height + VERTICAL_MARGIN_TO_WINDOW_EDGE_PX)
        return
      }

      /*
      Move it up from the bottom
      */
      if (direction === DIRECTION.DOWN && y + bounds.height > window.innerHeight) {
        setY(window.innerHeight - bounds.height - VERTICAL_MARGIN_TO_WINDOW_EDGE_PX)
        return
      }
    })

    observer.observe(elRef.current)
    return () => observer.disconnect(elRef.current)
  }, [x, y, direction])

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

  React.useEffect(() => {
    function closeContext (e) {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', closeContext)
    return () => {
      window.removeEventListener('keydown', closeContext)
    }
  }, [x, y, onClose])

  /*
  Make sure that the menu open in the direction
  where it's got the most free space
  */
  React.useEffect(() => {
    const viewportHeight = window.innerHeight
    if (_y > viewportHeight / 2) {
      setDirection(DIRECTION.UP)
      setY(current => current + VERTICAL_DIRECTION_SHIFT_PX)
    } else {
      setDirection(DIRECTION.DOWN)
      setY(current => current - VERTICAL_DIRECTION_SHIFT_PX)
    }
  }, [_y])

  return (
    <>
      {
        createPortal(
          <div
            ref={elRef}
            className={`ContextMenu ContextMenu--${direction}`}
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
