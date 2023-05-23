import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesStringInput ({ label, value = '', onChange = () => {} }) {
  const [id] = React.useState(`number-${random.number()}`)
  return (
    <div className='PreferencesStringInput'>
      <label htmlFor={id}>{label}</label>
      <input id={id} className='PreferencesStringInput-input' type='text' value={value} placeholder={label} onChange={e => onChange(e.target.value)} />
    </div>
  )
}
