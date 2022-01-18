import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesBooleanInput ({ label, value, onChange = () => {} }) {
  const id = `checkbox-${random.number()}`
  return (
    <div className='PreferencesBooleanInput'>
      <input id={id} type='checkbox' checked={value} onChange={e => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
