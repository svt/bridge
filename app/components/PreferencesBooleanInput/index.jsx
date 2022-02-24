import React from 'react'
import './style.css'

import * as random from '../../utils/random'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export function PreferencesBooleanInput ({ label, value = false, onChange = () => {} }) {
  const id = `checkbox-${random.number()}`
  return (
    <div className='PreferencesBooleanInput'>
      <input id={id} type='checkbox' checked={value} onChange={e => onChange(e.target.checked)} />
      <label htmlFor={id}>{label}</label>
    </div>
  )
}
