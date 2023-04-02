import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferenceSelectInput ({ label, value, options = [], onChange = () => {} }) {
  const id = `number-${random.number()}`
  return (
    <div className='PreferencesSelectInput'>
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={e => onChange(e.target.value)}>
        {
          options.map((option, i) => {
            return <option key={i} value={i}>{option}</option>
          })
        }
      </select>
    </div>
  )
}
