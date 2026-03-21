import React from 'react'
import './style.css'

const PHRASES = [
  'Thinking...',
  'Coming up with a response...'
]

export function ChatLoading () {
  return (
    <div className='ChatLoading'>
      <div className='ChatLoading-spinner'>
        <span className='Loader' />
      </div>
      {PHRASES[Math.floor(Math.random() * 100) % PHRASES.length]}
    </div>
  )
}