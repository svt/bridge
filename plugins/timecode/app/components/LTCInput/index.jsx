import React from 'react'
import './style.css'

export const LTCInput = ({ data = {}, onChange = () => {}, onDelete = () => {} }) => {
  function handleInput (key, newValue) {
    onChange({
      ...data,
      [key]: newValue
    })
  }

  function handleDelete () {
    onDelete()
  }

  return (
    <div className='LTCInput'>
      <div className='LTCInput-flexWrapper'>
        <div>
          <div className='LTCInput-input'>
            <input type='text' value={data.name || ''} placeholder='Name' onChange={e => handleInput('name', e.target.value)}></input>
          </div>
          <div className='LTCInput-input'>
            Device input
          </div>
          <div className='LTCInput-input'>
            Channel input
          </div>
        </div>
        <div className='LTCInput-actions'>
          <button className='Button Button--ghost' onClick={() => handleDelete()}>Delete</button>
        </div>
      </div>
    </div>
  )
}
