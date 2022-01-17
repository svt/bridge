import React from 'react'
import './style.css'

export const GridItem = ({ children, x, y, width, height }) => {
  return (
    <div className='GridItem'>
      {children}
    </div>
  )
}
