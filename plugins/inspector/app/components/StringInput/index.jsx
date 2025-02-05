/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function StringInput ({
  htmlFor,
  value = '',
  onChange = () => {},
  onKeyDown = () => {},
  large
}) {
  return (
    <input
      type='text'
      htmlFor={htmlFor}
      className={`StringInput ${large ? 'StringInput--large' : ''}`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => onKeyDown(e)}
    />
  )
}
