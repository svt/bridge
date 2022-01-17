import React from 'react'
import './style.css'

export function Notification ({ type, content }) {
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
    <div className={`Notification Notification--${type}`}>
      <div className='Notification-content' dangerouslySetInnerHTML={{ __html: content }} />
      <div className='Notification-controls'>
        <button className='Notification-hideBtn Link' onClick={handleHideBtnClick}>Dölj</button>
      </div>
    </div>
  )
}
