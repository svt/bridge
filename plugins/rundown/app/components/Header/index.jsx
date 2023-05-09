import React from 'react'
import bridge from 'bridge'

import './style.css'

import { StoreContext } from '../../storeContext'

import { Icon } from '../../../../../app/components/Icon'
import { ContextMenu } from '../../../../../app/components/ContextMenu'

import { ContextAddMenu } from '../ContextAddMenu'

export function Header () {
  const [store] = React.useContext(StoreContext)
  const [contextPos, setContextPos] = React.useState()

  function handleCreateOnClick (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleAdd (newItemId) {
    bridge.commands.executeCommand('rundown.appendItem', store?.id, newItemId)
  }

  return (
    <>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextAddMenu onAdd={newItemId => handleAdd(newItemId)} />
            </ContextMenu>
            )
          : <></>
      }
      <header className='Header'>
        <div className='Header-section'>
          <button className='Button--small' onClick={e => handleCreateOnClick(e)}>
            <Icon name='add' />
          </button>
        </div>
        <div className='Header-section'>
          <span className='Header-label'>Rundown id:</span>&nbsp;{store?.id}
        </div>
      </header>
    </>
  )
}
