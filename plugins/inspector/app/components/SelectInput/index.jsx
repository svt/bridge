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
            return <option key={i} value={i}>{value}</option>
          })
      }
    </select>
  )
}
