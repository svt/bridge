import React from 'react'
import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export function Notification ({ type, size = 'normal', content, disableInteraction }) {
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
      <div className='Notification-content' dangerouslySetInnerHTML={{ __html: content }} />
      {
        !disableInteraction
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
