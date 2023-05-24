import React from 'react'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import './style.css'

export function GridEmptyContent () {
  const [, applyShared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  function handleEnterEditMode () {
    applyShared({
      _connections: {
        [local.id]: {
          isEditingLayout: true
        }
      }
    })
  }

  return (
    <div className='GridEmptyContent'>
      <div>
        <h1>Empty tab</h1>
        Add widgets in the edit mode
        <div className='GridEmptyContent-actions'>
          <button className='Button Button--ghost' onClick={() => handleEnterEditMode()}>Enter edit mode</button>
        </div>
      </div>
    </div>
  )
}
