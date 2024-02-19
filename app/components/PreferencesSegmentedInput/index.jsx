import React from 'react'
import './style.css'

import { SegmentedControl } from '../SegmentedControl'

export function PreferencesSegmentedInput ({ label, value, segments = [], onChange = () => {} }) {
  return (
    <div className='PreferencesSegmentedInput'>
      <label>{label}</label>
      <div className='PreferencesSegmentedInput-controlWrapper'>
        <SegmentedControl
          values={segments}
          value={segments[value] || segments[0]}
          onChange={newValue => onChange(segments.indexOf(newValue))}
        />
      </div>
    </div>
  )
}
