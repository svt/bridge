{/*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/}

import React from 'react'

import './style.css'

export function Popup ({ children, open }) {
  return (
    <div className={`Popup u-theme--light ${open ? 'is-open' : ''}`}>
      <div className='Popup-content'>
        {children}
      </div>
    </div>
  )
}
