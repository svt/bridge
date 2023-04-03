import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesStringInput ({ label, value, onChange = () => {} }) {
  const id = `string-${random.number()}`
  return (
    <div className='PreferencesStringInput'>
      <input id={id} type='text' value={value} onChange={e => onChange(e.target.value)} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
