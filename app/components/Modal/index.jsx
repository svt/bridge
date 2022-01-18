import React from 'react'

import './style.css'

export function Modal ({ children, open }) {
  return (
    <div className={`Modal u-theme--light ${open ? 'is-open' : ''}`}>
      <div className='Modal-content'>
        {children}
      </div>
    </div>
  )
}
