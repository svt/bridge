/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function BooleanInput ({
  htmlFor,
  value = '',
  onChange = () => {},
  large
}) {
  return (
    <input
      type='checkbox'
      htmlFor={htmlFor}
      className='BooleanInput'
      checked={!!value}
      onChange={e => onChange(e.target.checked)}
    />
  )
}
