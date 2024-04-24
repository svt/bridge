import React from 'react'
import './style.css'

export const ItemButton = ({ label, color = 'transparent', onClick = () => {} }) => {
  return (
    <button className='ItemButton' onClick={() => onClick()} style={{ backgroundColor: color }}>
      { label }
    </button>
  )
}
