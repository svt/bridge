import React from 'react'
import './style.css'

import { Icon } from '../Icon'

export function ChatFooter ({ model, contextUsage = 0, onSend = () => {} }) {
  const [input, setInput] = React.useState()

  function handleSendMessage () {
    if (!input || input?.length === 0) {
      return
    }
    onSend({ text: input })
    setInput('')
  }

  function handleKeyDown (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className='ChatFooter' tabIndex={0}>
      <textarea
        className='ChatFooter-input'
        value={input || ''}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder='Type a message'
      />
      <div className='ChatFooter-actions'>
        <div className='ChatFooter-actionSection'>
          <div className='ChatFooter-contextUsage'>
            <div
              className='ChatFooter-contextPie'
              style={{ '--usage': `${Math.min(contextUsage, 1) * 100}%` }}
            />
          </div>
          <div className='ChatFooter-actionLabel'>{model}</div>
        </div>
        <div className='ChatFooter-actionSection'>
          <button className='ChatFooter-button' onClick={() => handleSendMessage()}>
            <Icon name='send' />
          </button>
        </div>
      </div>
    </div>
  )
}