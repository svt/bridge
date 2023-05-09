import React from 'react'
import bridge from 'bridge'

import { StoreContext } from '../storeContext'

import { RundownList } from '../components/RundownList'
import { ContextAddMenu } from '../components/ContextAddMenu'

import { ContextMenu } from '../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../app/components/ContextMenuItem'

export function Rundown () {
  const [store] = React.useContext(StoreContext)

  const [contextPos, setContextPos] = React.useState()

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleItemCreate (itemId) {
    bridge.commands.executeCommand('rundown.appendItem', store?.id, itemId)
  }

  return (
    <div className='View' onContextMenu={e => handleContextMenu(e)}>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Add'>
                <ContextAddMenu onAdd={newItemId => handleItemCreate(newItemId)}/>
              </ContextMenuItem>
            </ContextMenu>
            )
          : <></>
      }
      <RundownList rundownId={store?.id} />
    </div>
  )
}
