import React from 'react'
import bridge from 'bridge'

import './style.css'

import { StoreContext } from '../../storeContext'
import { SharedContext } from '../../sharedContext'

import { Icon } from '../../../../../app/components/Icon'

import { ContextMenu } from '../../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'

export function Header () {
  const [store] = React.useContext(StoreContext)
  const [shared] = React.useContext(SharedContext)
  const [contextPos, setContextPos] = React.useState()

  function handleCreateOnClick (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleItemOnClick (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    bridge.commands.executeCommand('rundown.appendItem', store?.id, itemId)
  }

  return (
    <>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              {
                Object.values(shared?._types || {})
                  .filter(type => type.name)
                  .map(type => {
                    return <ContextMenuItem key={type.id} text={type.name} onClick={() => handleItemOnClick(type.id)} />
                  })
              }
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
