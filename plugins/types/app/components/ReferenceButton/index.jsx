import React from 'react'
import './style.css'

export const ReferenceButton = ({ onClick = () => {} }) => {
  return (
    <div className='ReferenceButton'>
      <button className='Button ReferenceButton-button' onClick={() => onClick()}>Go to target</button>
    </div>
  )
}
