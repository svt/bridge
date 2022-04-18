import React from 'react'
import './style.css'

import { ContextMenu } from '../ContextMenu'

/**
 * The x-axis offset used for
 * nested context menus
 * @type { Number }
 */
const CTX_MENU_OFFSET_X_PX = 150

/**
 * The y-axis offset used for
 * nested context menus
 * @type { Number }
 */
const CTX_MENU_OFFSET_Y_PX = 5

/**
 * A delay applied to when the
 * mouse leaves the current item
 * @type { Number }
 */
const MOUSE_LEAVE_DELAY_MS = 100

export const ContextMenuItem = ({ text, children = [], onClick = () => {} }) => {
  const elRef = React.useRef()
  const [hover, setHover] = React.useState(false)
  const childArr = Array.isArray(children) ? children : [children]

  const timeoutRef = React.useRef()

  function handleMouseEnter () {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setHover(true)
  }

  function handleMouseLeave () {
    timeoutRef.current = setTimeout(() => {
      setHover(false)
    }, MOUSE_LEAVE_DELAY_MS)
  }

  const bounds = elRef.current?.getBoundingClientRect()

  return (
    <div
      ref={elRef}
      className='ContextMenuItem'
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick()}
    >
      <div className='ContextMenuItem-text'>
        {text}
      </div>
      {
        hover && childArr.length > 0
          ? (
            <ContextMenu x={bounds?.x + CTX_MENU_OFFSET_X_PX} y={bounds?.y + CTX_MENU_OFFSET_Y_PX}>
              {children}
            </ContextMenu>
            )
          : <></>
      }
    </div>
  )
}
