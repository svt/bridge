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
  data = {},
  onChange = () => {},
  onKeyDown = () => {},
  onScroll = () => {},
  large
}) {
  return (
    <input
      type='text'
      htmlFor={htmlFor}
      className={`StringInput ${data['ui.glyph'] && 'StringInput--glyph'} ${large ? 'StringInput--large' : ''}`}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => onKeyDown(e)}
      onScroll={e => onScroll(e)}
    />
  )
}
