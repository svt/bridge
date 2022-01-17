import React from 'react'
import './style.css'

export function Header ({ title = 'Bridge' }) {
  return (
    <header className='Header'>
      <div />
      <div className='Header-center'>
        {title}
      </div>
      <div>
        <button className='Header-editBtn' />
      </div>
    </header>
  )
}
