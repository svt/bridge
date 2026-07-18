import React from 'react'
import './style.css'

import { Icon } from '../Icon'

export function ChatFooter ({ model, contextUsage = 0, isThinking = false, onSend = () => {} }) {
  const [input, setInput] = React.useState()
  const [outline, setOutline] = React.useState({ width: 100, height: 100, radius: 10 })
  const footerRef = React.useRef()
  const gradientId = React.useId().replace(/:/g, '')

  const glowGradientId = `chat-footer-glow-${gradientId}`
  const strokeGradientId = `chat-footer-stroke-${gradientId}`

  React.useLayoutEffect(() => {
    const node = footerRef.current
    if (!node) {
      return
    }

    function updateOutline () {
      const rect = node.getBoundingClientRect()
      const styles = window.getComputedStyle(node)
      const borderRadius = parseFloat(styles.borderTopLeftRadius) || 10

      setOutline({
        width: Math.max(2, rect.width),
        height: Math.max(2, rect.height),
        radius: Math.max(0, borderRadius - 1)
      })
    }

    updateOutline()

    const observer = new ResizeObserver(updateOutline)
    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [])

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

  const strokeInset = 0.75
  const rectWidth = Math.max(0, outline.width - (strokeInset * 2))
  const rectHeight = Math.max(0, outline.height - (strokeInset * 2))
  const cornerRadius = Math.max(0, Math.min(outline.radius, rectWidth / 2, rectHeight / 2))

  return (
    <div ref={footerRef} className={`ChatFooter ${isThinking ? 'ChatFooter--thinking' : ''}`} tabIndex={0}>
      <svg className='ChatFooter-thinkingOutline' viewBox={`0 0 ${outline.width} ${outline.height}`} preserveAspectRatio='xMidYMid meet' aria-hidden='true'>
        <defs>
          <linearGradient id={glowGradientId} x1='0%' y1='0%' x2='100%' y2='100%'>
            <stop offset='0%' stopColor='var(--agent-thinking-c1)' />
            <stop offset='35%' stopColor='var(--agent-thinking-c2)' />
            <stop offset='70%' stopColor='var(--agent-thinking-c3)' />
            <stop offset='100%' stopColor='var(--agent-thinking-c4)' />
          </linearGradient>
          <linearGradient id={strokeGradientId} x1='100%' y1='0%' x2='0%' y2='100%'>
            <stop offset='0%' stopColor='var(--agent-thinking-c2)' />
            <stop offset='30%' stopColor='var(--agent-thinking-c3)' />
            <stop offset='65%' stopColor='var(--agent-thinking-c4)' />
            <stop offset='100%' stopColor='var(--agent-thinking-c1)' />
          </linearGradient>
        </defs>
        <rect className='ChatFooter-thinkingGlow' style={{ stroke: `url(#${glowGradientId})` }} x={strokeInset} y={strokeInset} width={rectWidth} height={rectHeight} rx={cornerRadius} ry={cornerRadius} pathLength='100' />
        <rect className='ChatFooter-thinkingStroke' style={{ stroke: `url(#${strokeGradientId})` }} x={strokeInset} y={strokeInset} width={rectWidth} height={rectHeight} rx={cornerRadius} ry={cornerRadius} pathLength='100' />
      </svg>
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