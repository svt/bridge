import React from 'react'
import './style.css'

export const ModalHeader = ({ title }) => {
  return (
    <header className='ModalHeader'>
      <div className='ModalHeader-title'>{title}</div>
    </header>
  )
}