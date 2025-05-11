import React from 'react'

import './style.css'

import { Icon } from '../Icon'

export function Message ({ children, dismissable, ttl, onDismiss = () => {} }) {
  /*
   * Set a timeout in order to dismiss the message
   * automatically if the ttl prop is set to a truthy value
   */
  React.useEffect(() => {
    if (!ttl) {
      return
    }
    const timeout = setTimeout(() => {
      onDismiss()
    }, ttl)
    return () => clearTimeout(timeout)
  }, [ttl])

  return (
    <div className='Message'>
      <div className='Message-body'>
        { children }
      </div>
      <div className='Message-actions'>
        {
          dismissable &&
          <button
            className='Message-dismissBtn'
            onClick={() => onDismiss()}
          >
            <Icon name='close' />
          </button>
        }
      </div>
    </div>
  )
}

export function TextMessage (props) {
  return (
    <Message {...props}>
      <div className='Message-text'>{props?.text}</div>
    </Message>
  )
}

export function SuccessMessage (props) {
  return (
    <Message {...props}>
      <div className='Message-content--split'>
        <div className='Message-icon'>
          <Icon name='colorSuccess' originalColors />
        </div>
        <div className='Message-text'>{props?.text}</div>
      </div>
    </Message>
  )
}

export function WarningMessage (props) {
  return (
    <Message {...props}>
      <div className='Message-content--split'>
        <div className='Message-icon Message-icon--large'>
          <Icon name='warning' />
        </div>
        <div className='Message-text'>{props?.text}</div>
      </div>
    </Message>
  )
}
