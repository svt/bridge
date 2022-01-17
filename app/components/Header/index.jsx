import React from 'react'
import './style.css'

export function Header ({ title = 'Bridge' }) {
  return (
    <header className='Header'>
      <div className='Header-center'>
        <button className='Button--primary'>Edit</button>
        <button className='Button--primary'>Playout</button>
      </div>
    </header>
  )
}
