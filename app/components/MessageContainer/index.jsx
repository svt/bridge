import React from 'react'

import './style.css'

import {
  TextMessage,
  SuccessMessage,
  WarningMessage
} from '../Message'

import * as api from '../../api'

const MESSAGE_TYPES = {
  text: {
    component: TextMessage
  },
  success: {
    component: SuccessMessage
  },
  warning: {
    component: WarningMessage
  }
}

export function MessageContainer () {
  const [messages, setMessages] = React.useState([])

  React.useEffect(() => {
    function onMessage (message) {
      setMessages(messages => {
        const exists = messages.find(existingMessage => existingMessage.id === message.id)
        if (exists) {
          return messages
        }
        return [...messages, message]
      })
    }

    async function setup () {
      const bridge = await api.load()
      bridge.events.on('message', onMessage)
    }
    setup()

    return () => {
      async function teardown () {
        const bridge = await api.load()
        bridge.events.off('shortcut', onMessage)
      }
      teardown()
    }
  }, [])

  function handleDismiss (id) {
    setMessages(messages => {
      const index = messages.findIndex(message => message.id === id)
      if (index === -1) {
        return messages
      }
      const newMessages = [...messages]
      newMessages.splice(index, 1)
      return newMessages
    })
  }

  return (
    <div className='MessageContainer'>
      {
        messages
          .filter(message => MESSAGE_TYPES[message.type])
          .map(message => {
            const Component = MESSAGE_TYPES[message.type].component
            return (
              <Component
                key={message.id}
                ttl={message.ttl}
                text={message.text}
                dismissable={message.dismissable}
                onDismiss={() => handleDismiss(message.id)}
              />
            )
          })
      }
    </div>
  )
}
