import React from 'react'
import './style.css'

/**
 * @example
 * "items": [
 *   { "label": "Dark", "color": "#232427", "value": "dark" },
 *   { "label": "Light", "color": "#EBEBEB", "value": "light" }
 * ]
 */
export function PreferencesThemeInput ({ label, items = [], value, onChange = () => {} }) {
  return (
    <div className='PreferencesThemeInput'>
      {
        items
          .map((item, i) => {
            const isActive = value === item.value
            return (
              <div
                key={i}
                className={`PreferencesThemeInput-item ${isActive ? 'is-active' : ''}`}
                onClick={() => onChange(item.value)}
              >
                <div className='PreferencesThemeInput-itemColor' style={{ backgroundColor: item.color }} />
                <div className='PreferencesThemeInput-itemLabel'>
                  {item.label}
                </div>
              </div>
            )
          })
      }
    </div>
  )
}
