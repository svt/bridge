import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesBooleanInput ({ label, value = false, onChange = () => {} }) {
  const [id] = React.useState(`number-${random.number()}`)
  return (
    <div className='PreferencesBooleanInput'>
      <input id={id} type='checkbox' checked={value} onChange={e => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
