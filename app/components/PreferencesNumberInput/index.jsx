import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesNumberInput ({ label, value = '', min = 0, max = 10, onChange = () => {} }) {
  const [id] = React.useState(`number-${random.number()}`)
  const [error, setError] = React.useState()

  function handleChange (newValue) {
    if (newValue < min) {
      setError(`Cannot be less than ${min}`)
      onChange(newValue)
      return
    }

    if (newValue > max) {
      setError(`Cannot be more than ${max}`)
      onChange(newValue)
      return
    }

    setError(undefined)
    onChange(newValue)
  }

  return (
    <div className='PreferencesNumberInput'>
      <input id={id} className='PreferencesNumberInput-input' type='number' min={min} max={max} value={value} onChange={e => handleChange(e.target.value)} />
      <label htmlFor={id}>{label}</label>
      {
        error &&
        <div className='PreferencesNumberInput-error'>{error}</div>
      }
    </div>
  )
}
