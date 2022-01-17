import React from 'react'
import './style.css'

export const ContextMenu = ({ x, y, children }) => {
  return (
    <div className='ContextMenu' style={{ top: y, left: x }}>
      {children}
    </div>
  )
}
