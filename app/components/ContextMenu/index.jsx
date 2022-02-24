import React from 'react'
import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export const ContextMenu = ({ x, y, children }) => {
  return (
    <div className='ContextMenu' style={{ top: y, left: x }}>
      {children}
    </div>
  )
}
