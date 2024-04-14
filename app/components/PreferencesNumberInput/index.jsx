import React from 'react'
import './style.css'

import * as random from '../../utils/random'

export function PreferencesNumberInput ({ label, value = '', min = 0, max = 10, onChange = () => {} }) {
  const [id] = React.useState(`number-${random.number()}`)
  const [error, setError] = React.useState()

  React.useEffect(() => {
    if (value < min) {
      setError(`Cannot be less than ${min}`)
      return
    }

    if (value > max) {
      setError(`Cannot be more than ${max}`)
      return
    }

    setError(undefined)
  }, [value])

  return (
    <div className='PreferencesNumberInput'>
      <input id={id} className='PreferencesNumberInput-input' type='number' min={min} max={max} value={value} onChange={e => onChange(e.target.value)} />
      <label htmlFor={id}>{label}</label>
      {
        error &&
        <div className='PreferencesNumberInput-error'>{error}</div>
      }
    </div>
  )
}
