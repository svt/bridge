import React from 'react'
import './style.css'

import { marked } from 'marked'

import { Icon } from '../Icon'

import { Animation, TIMING_FUNCTIONS } from '../../utils/Animation'

const ANIMATION_DURATION_PER_CHARACTER_MS_SLOW = 10
const ANIMATION_DURATION_PER_CHARACTER_MS_FAST = 3
const ANIMATION_SPEED_THRESHOLD_STRING_LENGTH = 500

/*
Setup the markdown renderer
*/
marked.use({
  silent: true,
  breaks: true
})

export function ChatMessage ({ type, text: _text, animate = true, onSend = () => {}, onRender = () => {} }) {
  const [md, setMd] = React.useState()
  const [html, setHtml] = React.useState()

  React.useEffect(() => {
    if (!_text || typeof _text !== 'string') {
      return
    }

    /*
    Skip the animation if this message
    represents user input or was restored
    from history
    */
    if (type !== 'agent' || !animate) {
      setMd(_text)
      return
    }
    
    const speed = _text.length > ANIMATION_SPEED_THRESHOLD_STRING_LENGTH
      ? ANIMATION_DURATION_PER_CHARACTER_MS_FAST
      : ANIMATION_DURATION_PER_CHARACTER_MS_SLOW

    const anim = new Animation(
      0,
      _text.length,
      _text.length * speed,
      TIMING_FUNCTIONS.linear,
      value => {
        setMd(_text.substring(0, value))
      }
    )

    anim.start()
    return () => {
      anim.stop()
    }
  }, [_text, type])

  React.useEffect(() => {
    const parsed = marked.parse(md)
    setHtml(parsed)
  }, [md])

  React.useEffect(() => {
    onRender()
  }, [html, onRender])

  function handleResend () {
    onSend({ text: _text })
  }

  return (
    <div className={`ChatMessage ChatMessage--${type}`}>
      <div className='ChatMessage-content'  dangerouslySetInnerHTML={{ __html: html }} />
      {
        type === 'user' &&
        (
          <div className='ChatMessage-actions'>
            <button className='ChatMessage-actionButton' onClick={() => handleResend()}>
              <Icon name='reload' />
            </button>
          </div>
        )
      }
    </div>
  )
}