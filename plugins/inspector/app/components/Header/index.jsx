/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

import React from 'react'
import './style.css'

import { StoreContext } from '../../storeContext'

export function Header () {
  const [store] = React.useContext(StoreContext)

  return (
    <header className='Header'>
      <div className='Header-section'>
        {
          store?.selection?.join(',')
        }
      </div>
    </header>
  )
}
