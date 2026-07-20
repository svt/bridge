import React from 'react'
import './style.css'

import icon from '../../assets/icons/warning.svg'

export const ErrorMessage = ({ heading, message }) => {
  return (
    <div className='ErrorMessage'>
      <div className='ErrorMessage-container'>
        <div dangerouslySetInnerHTML={{ __html: icon }} />
        <div className='ErrorMessage-heading'>{heading}</div>
        {message}
      </div>
    </div>
  )
}
