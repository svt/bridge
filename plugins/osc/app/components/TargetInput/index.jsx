import React from 'react'
import './style.css'

export const TargetInput = ({ data = {}, onChange = () => {}, onDelete = () => {} }) => {
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
    <div className='TargetInput'>
      <div className='TargetInput-flexWrapper'>
        <div>
          <div className='TargetInput-input'>
            <input type='text' value={data.name || ''} placeholder='Name' onChange={e => handleInput('name', e.target.value)}></input>
          </div>
          <div className='TargetInput-input'>
            <div className='TargetInput-flexInputs'>
              <input type='text' value={data.host || ''} placeholder='Host' onChange={e => handleInput('host', e.target.value)}></input>
              <input type='number' className='TargetInput-input--small' value={data.port || ''} placeholder='Port' onChange={e => handleInput('port', e.target.value)}></input>
            </div>
          </div>
        </div>
        <div className='TargetInput-actions'>
          <button className='Button Button--ghost' onClick={() => handleDelete()}>Delete</button>
        </div>
      </div>
    </div>
  )
}
