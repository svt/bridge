import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesNumberInput ({ label, value, min = 0, max = 10, onChange = () => {} }) {
  const id = `number-${random.number()}`
  return (
    <div className='PreferencesNumberInput'>
      <input id={id} type='number' min={min} max={max} value={value} onChange={e => onChange(e.target.value)} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
