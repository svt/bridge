import React from 'react'
import bridge from 'bridge'

import * as message from '../utils/message'

import { ChatMessageToolUse } from '../components/ChatMessageToolUse'
import { ChatMessage } from '../components/ChatMessage'
import { ChatLoading } from '../components/ChatLoading'
import { ChatFooter } from '../components/ChatFooter'
import { ChatHero } from '../components/ChatHero'
import { ChatInteractionConfirm } from '../components/ChatInteractionConfirm'
import { NotConfigured } from '../components/NotConfigured'

const MESSAGE_RENDERER = {
  confirm: ChatInteractionConfirm,
  toolUse: ChatMessageToolUse,
  default: ChatMessage
}

const CUSTOM_PROVIDER = 'custom'

export function Chat () {
  const [messages, setMessages] = React.useState([])
  const [isWaitingForAnswer, setIsWaitingForAnswer] = React.useState()
  const [model, setModel] = React.useState()
  const [contextUsage, setContextUsage] = React.useState(0)
  const [isConfigured, setIsConfigured] = React.useState(true)

  const conversationRef = React.useRef()

  React.useEffect(() => {
    function checkSettings (settings) {
      if (settings?.provider === CUSTOM_PROVIDER) {
        setIsConfigured(!!settings?.baseUrl)
      } else {
        setIsConfigured(!!settings?.apiKey)
      }
    }

    /*
    This function triggers checkSettings whenever
    the _userDefaults-object of the state changes
    */
    function onStateChange (newState, set) {
      if (!Object.prototype.hasOwnProperty.call(set, '_userDefaults')) {
        return
      }
      const settings = newState?._userDefaults?.['bridge-plugin-agent']?.settings
      checkSettings(settings)
    }

    /*
    This function triggers the checkSettings
    function on initial component load
    */
    async function initialCheck () {
      const settings = await bridge.state.get('_userDefaults.bridge-plugin-agent.settings')
      checkSettings(settings)
    }

    function unload () {
      bridge.events.off('state.change', onStateChange)
    }

    bridge.events.on('state.change', onStateChange)
    window.addEventListener('beforeunload', unload)

    initialCheck()
    return () => {
      window.removeEventListener('beforeunload', unload)
      unload()
    }
  }, [])

  React.useEffect(() => {
    async function loadHistory () {
      const res = await bridge.commands.executeCommand('agent.getHistory')
      if (!res?.messages?.length) {
        return
      }

      setMessages(res.messages.map(msg => ({ ...msg, fromHistory: true })))

      const lastWithModel = [...res.messages].reverse().find(m => m.model)
      if (lastWithModel?.model) {
        setModel(lastWithModel.model)
      }

      const lastWithUsage = [...res.messages].reverse().find(m => m.contextUsage !== undefined)
      if (lastWithUsage?.contextUsage !== undefined) {
        setContextUsage(lastWithUsage.contextUsage)
      }
    }
    loadHistory()
  }, [])

  React.useEffect(() => {
    function handleReceiveMessage (msg) {
      if (msg.type === 'agent') {
        setIsWaitingForAnswer(false)
      }

      if (msg.type === 'agent' && msg.model) {
        setModel(msg.model)
      }

      if (msg.contextUsage !== undefined) {
        setContextUsage(msg.contextUsage)
      }

      setMessages(current => {
        return [...current, msg]
      })
    }
    bridge.events.on('agent.message', handleReceiveMessage)

    window.onbeforeunload = () => {
      bridge.events.off('agent.message', handleReceiveMessage)
    }

    return () => {
      bridge.events.off('agent.message', handleReceiveMessage)
    }
  }, [])

  function handleSendMessage (msg) {
    const msgObj = message.messageFactory(msg)
    bridge.commands.executeCommand(`agent.query`, msgObj)
    setIsWaitingForAnswer(true)
  }

  function handleScrollToBottom () {
    if (!conversationRef.current) {
      return
    }
    conversationRef.current.scrollTo(0, conversationRef.current.scrollHeight)
  }

  return (
    <div className='Chat'>
      <div ref={conversationRef} className='Chat-conversation'>
        {
          !isConfigured &&
          <NotConfigured />
        }
        {
          messages.length === 0 && isConfigured &&
          <ChatHero onSend={msg => handleSendMessage(msg)} />
        }
        {
          messages
            .filter(message => message?.text)
            .map(message => {
              const Component = MESSAGE_RENDERER[message?.type] || MESSAGE_RENDERER.default
              
              return (
                <div key={message?.id} className='Chat-message'>
                  <Component
                    {...message}
                    animate={!message?.fromHistory}
                    onSend={msg => handleSendMessage(msg)}
                    onRender={() => handleScrollToBottom()}
                  />
                </div>
              )
            })
        }
        {
          isWaitingForAnswer &&
          (
            <div className='Chat-message'>
              <ChatLoading />
            </div>
          )
        }
      </div>
      {
        isConfigured &&
        (
          <div className='Chat-footer'>
            <ChatFooter model={model} contextUsage={contextUsage} onSend={msg => handleSendMessage(msg)} />
          </div>
        )
      }
    </div>
  )
}