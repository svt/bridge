import React from 'react'

import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export function Master ({ children, sidebar }) {
  return (
    <div className='Layout--master'>
      <div className='Layout--master-sidebar'>
        {sidebar}
      </div>
      <main className='Layout--master-main'>
        {children}
      </main>
    </div>
  )
}
