/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function TextInput ({
  htmlFor,
  value,
  onChange = () => {}
}) {
  return (
    <input type='text' htmlFor={htmlFor} className='Input' value={value} onChange={e => onChange(e.target.value)} />
  )
}
