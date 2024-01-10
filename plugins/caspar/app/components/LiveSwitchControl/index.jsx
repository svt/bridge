import React from 'react'
import './style.css'

export const LiveSwitchControl = ({ value, onChange = () => {} }) => {
  return (
    <div className={`LiveSwitchControl ${value ? 'is-live' : ''}`}>
      <div className='LiveSwitchControl-title'>Caspar is { value ? 'live' : 'not live' }</div>
      <div className='LiveSwitchControl-control'>
        <input type='checkbox' checked={value} onChange={e => onChange(e.target.checked)} />
      </div>
    </div>
  )
}
