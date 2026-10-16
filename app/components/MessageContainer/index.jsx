import React from 'react'

import './style.css'

import {
  TextMessage,
  SuccessMessage,
  WarningMessage,
  ProgressMessage
} from '../Message'

import * as api from '../../api'

/**
 * The maximum number of
 * messages to show at a time
 */
const MAX_SHOWN_MESSAGE_COUNT = 5

const MESSAGE_TYPES = {
  text: {
    component: TextMessage
  },
  success: {
    component: SuccessMessage
  },
  warning: {
    component: WarningMessage
  },
  progress: {
    component: ProgressMessage
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

    function onUpdate (id, set) {
      setMessages(messages => messages.map(message => {
        return message.id === id ? { ...message, ...set } : message
      }))
    }

    function onDismiss (id) {
      setMessages(messages => messages.filter(message => message.id !== id))
    }

    async function setup () {
      const bridge = await api.load()
      bridge.events.on('message', onMessage)
      bridge.events.on('message.update', onUpdate)
      bridge.events.on('message.dismiss', onDismiss)
    }
    setup()

    return () => {
      async function teardown () {
        const bridge = await api.load()
        bridge.events.off('message', onMessage)
        bridge.events.off('message.update', onUpdate)
        bridge.events.off('message.dismiss', onDismiss)
      }
      teardown()
    }
  }, [])

  /**
   * Dismiss a message by removing
   * it from the component state
   * @param { String } id The message's UUID
   */
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
          /*
          Filer out messages that are of an invalid type
          */
          .filter(message => MESSAGE_TYPES[message.type])
          
          /*
          Never show more messages than
          the max message count
          */
          .slice(Math.max(messages.length - MAX_SHOWN_MESSAGE_COUNT, 0), messages.length)
          
          .map(message => {
            const Component = MESSAGE_TYPES[message.type].component
            return (
              <Component
                key={message.id}
                ttl={message.ttl}
                text={message.text}
                progress={message.progress}
                dismissable={message.dismissable}
                onDismiss={() => handleDismiss(message.id)}
              />
            )
          })
      }
    </div>
  )
}
