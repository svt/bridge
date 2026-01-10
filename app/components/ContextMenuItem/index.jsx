import React from 'react'
import './style.css'

import { ContextMenu } from '../ContextMenu'
import { Icon } from '../Icon'

/**
 * The x-axis offset used for
 * nested context menus
 * @type { Number }
 */
const CTX_MENU_OFFSET_X_PX = 150

/**
 * A delay applied to when the
 * mouse leaves the current item
 * @type { Number }
 */
const MOUSE_LEAVE_DELAY_MS = 150

export const ContextMenuItem = ({ text, children = [], onClick = () => {} }) => {
  const elRef = React.useRef()

  /*
  Delayed hover is used for preventing unmounting of
  child menus when the cursor leaves the item,
  regular hover is used for tinting the item
  */
  const [delayedHover, setDelayedHover] = React.useState(false)
  const [hover, setHover] = React.useState(false)

  const childArr = Array.isArray(children) ? children : [children]

  const timeoutRef = React.useRef()

  function handleMouseEnter () {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setDelayedHover(true)
    setHover(true)
  }

  function handleMouseLeave () {
    setHover(false)
    timeoutRef.current = setTimeout(() => {
      setDelayedHover(false)
    }, MOUSE_LEAVE_DELAY_MS)
  }

  function handleKeyDown (e) {
    if (e.key === 'Enter') {
      onClick()
    }
  }

  function handleFocus (e) {
    setDelayedHover(true)
    setHover(true)
  }

  const bounds = elRef.current?.getBoundingClientRect()

  return (
    <div
      ref={elRef}
      className={`ContextMenuItem ${hover ? 'is-hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick()}
      onKeyDown={e => handleKeyDown(e)}
      onFocus={e => handleFocus(e)}
      tabIndex={0}
    >
      <div className='ContextMenuItem-text'>
        {text}
      </div>
      {
        childArr.length > 0 &&
        <Icon name='arrowRight' color='black' />
      }
      {
        delayedHover && childArr.length > 0
          ? (
            <ContextMenu x={bounds?.x + CTX_MENU_OFFSET_X_PX} y={bounds?.y + bounds?.height / 2}>
              {children}
            </ContextMenu>
            )
          : <></>
      }
    </div>
  )
}
