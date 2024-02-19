import React from 'react'
import './style.css'

export function SegmentedControl ({ className = '', value: _value, values = [], onChange = () => {} }) {
  return (
    <div className={`SegmentedControl ${className}`}>
      {
        (Array.isArray(values) ? values : [])
          .map(value => {
            const isActive = value === _value
            return (
              <div
                key={value}
                className={`SegmentedControl-segment ${isActive ? 'is-active' : ''}`}
                onClick={() => !isActive && onChange(value)}
              >
                {value}
              </div>
            )
          })
      }
    </div>
  )
}
