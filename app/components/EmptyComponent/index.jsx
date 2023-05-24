import React from 'react'
import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import './style.css'

export const EmptyComponent = () => {
  const [shared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const isEditingLayout = shared?._connections?.[local?.id]?.isEditingLayout

  return (
    <div className='EmptyComponent'>
      <div className='EmptyComponent-container'>
        <div className='EmptyComponent-heading'>No widget selected</div>
        { isEditingLayout && 'Right click for options' }
      </div>
    </div>
  )
}
