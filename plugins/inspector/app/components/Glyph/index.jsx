/*
 * SPDX-FileCopyrightText: 2026 Axel Boberg
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

export function Glyph ({ char }) {
  if (!char) {
    return <></>
  }
  return <span className='Glyph'>{char}</span>
}
