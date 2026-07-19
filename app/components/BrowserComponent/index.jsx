import React from 'react'
import './style.css'

export const BrowserComponent = ({ data = {} }) => {
  return (
    <div className='BrowserComponent'>
      <div className='BrowserComponent-container'>
        <div className='BrowserComponent-heading'>Browser</div>
        {data.component}
      </div>
    </div>
  )
}
