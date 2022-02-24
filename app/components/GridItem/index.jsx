import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

export const GridItem = ({ children }) => {
  const [shared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  /**
   * Indicating whether or not the user
   * is currently in layout edit mode
   * @type { Boolean }
   */
  const userIsEditingLayout = shared[local.id]?.isEditingLayout

  return (
    <div className={`GridItem ${userIsEditingLayout ? 'is-editing' : ''}`}>
      <div className='GridItem-content'>
        {children}
      </div>
    </div>
  )
}
