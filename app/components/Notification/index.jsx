import React from 'react'
import './style.css'

import { Icon } from '../Icon'

export function Notification ({ type, size = 'normal', icon, title, description, interactionEnabled }) {
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
    <div className={`Notification Notification--${type} Notification-size--${size}`}>
      <div className='Notification-content'>
        {
          icon && <span className='Notification-contentSection'><Icon name={icon} /></span>
        }
        {
          title && <span className='Notification-contentSection Notification-title'>{title}</span>
        }
        {
          description && <span className='Notification-contentSection Notification-description'>{description}</span>
        }
      </div>
      {
        interactionEnabled
          ? (
            <div className='Notification-controls'>
              <button className='Notification-hideBtn Link' onClick={handleHideBtnClick}>Dölj</button>
            </div>
            )
          : <></>
      }
    </div>
  )
}
