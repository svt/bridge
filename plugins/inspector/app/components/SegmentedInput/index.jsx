/*
 * SPDX-FileCopyrightText: 2026 Axel Boberg
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function SegmentedInput ({
  value,
  data = {},
  onChange = () => {}
}) {
  const current = value ?? data?.default

  return (
    <div className='SegmentedInput' role='radiogroup'>
      {
        (data?.enum || [])
          .map((option, i) => {
            let label = option
            let key = i

            /*
            Allow for using a custom id
            if the option is an object
            containing the keys 'id' and 'label'
            */
            if (typeof option === 'object' && option.hasOwnProperty('value')) {
              label = option.label
              key = option.value
            }

            const isSelected = String(current) === String(key)

            return (
              <button
                key={key}
                type='button'
                role='radio'
                aria-checked={isSelected}
                className={`SegmentedInput-option ${isSelected ? 'is-selected' : ''}`}
                onClick={() => onChange(key)}
                >
                {label}
              </button>
            )
          })
      }
    </div>
  )
}
