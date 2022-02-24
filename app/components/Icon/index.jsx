import React from 'react'
import icons from '../../assets/icons'

import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export function Icon ({ name = 'placeholder', src }) {
  return (
    <span className='Icon' dangerouslySetInnerHTML={{ __html: icons[name] || icons.placeholder }} />
  )
}
