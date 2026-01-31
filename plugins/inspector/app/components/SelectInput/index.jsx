/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function SelectInput ({
  value = '',
  data = {},
  onChange = () => {}
}) {
  return (
    <select
      className='SelectInput Select--small'
      value={value}
      onChange={e => onChange(e.target.value)}
      >
        {
          (data?.enum || [])
            .map((value, i) => {
              let label = value
              let key = i

              /*
              Allow for using a custom id
              if the option is an object
              containing the keys 'id' and 'label'
              */
              if (typeof value === 'object' && value.hasOwnProperty('value')) {
                label = value.label
                key = value.value
              }

              return <option key={key} value={key}>{label}</option>
            })
        }
    </select>
  )
}
