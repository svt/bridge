/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

import { Icon } from '../Icon'

export function Accordion ({ title, children, open: _open = true }) {
  const [open, setOpen] = React.useState(_open)

  function handleClick () {
    setOpen(!open)
  }

  return (
    <div className={`Accordion ${open ? 'is-open' : ''}`}>
      <div className='Accordion-header' onClick={() => handleClick()}>
        <div className='Accordion-icon'>
          <Icon name='arrow-down' />
        </div>
        <div className='Accordion-title'>
          {title}
        </div>
      </div>
      {
        open
          ? children
          : <></>
      }
    </div>
  )
}
