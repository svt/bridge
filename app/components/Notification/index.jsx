import React from 'react'
import { createPortal } from 'react-dom'

import './style.css'

import { Icon } from '../Icon'

export function Notification ({ type, size = 'normal', icon, title, description, controls = <></>, closable }) {
  const [isHidden, setIsHidden] = React.useState(false)

  function handleHideBtnClick () {
    setIsHidden(true)
  }

  /*
  If the notification is meant
  to be hidden, render nothing
  */
  if (isHidden) {
    return <></>
  }

  return (
    <>
      {
        createPortal(
          <div className={`Notification Notification--${type} Notification-size--${size}`}>
            <div className='Notification-content'>
              {
                icon && <span className='Notification-contentSection Notification-icon'><Icon name={icon} color='var(--color-text)' /></span>
              }
              {
                title && <span className='Notification-contentSection Notification-title'>{title}</span>
              }
              {
                description && <span className='Notification-contentSection Notification-description'>{description}</span>
              }
            </div>
            <div className='Notification-controls'>
              { controls }
              { closable && <button className='Notification-hideBtn Link' onClick={() => handleHideBtnClick()}>Dölj</button> }
            </div>
          </div>,
          document.body
        )
      }
    </>
  )
}
