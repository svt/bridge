{/*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/}

import React from 'react'
import './style.css'

export const ContextMenu = ({ x, y, children }) => {
  return (
    <div className='ContextMenu' style={{ top: y, left: x }}>
      {children}
    </div>
  )
}
