import React from 'react'
import './style.css'

const PROMPTS = {
  PROOF_READ: 'Help me proof read all items in the rundown and please let me know if I\'ve made any mistakes. Prioritize template data and naming. Return an overview in list form of the strings that might be misspelled. Do not list unnecessary information.'
}

export function ChatHero ({ onSend = () => {} }) {
  return (
    <div className='ChatHero'>
      <div className='ChatHero-centered'>
        <h1>Hi, I'm Bridget</h1>
        <div className='ChatHero-description'>
          Let me help you with your project,<br />just type a message below or<br />use one of the prepared tasks
        </div>
        <button className='Button' onClick={() => onSend({ text: PROMPTS.PROOF_READ })}>Proof read my rundown</button>
      </div>
    </div>
  )
}