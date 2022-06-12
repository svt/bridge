import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { StoreContext } from '../storeContext'

import { RundownList } from '../components/RundownList'

import { ContextMenu } from '../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../app/components/ContextMenuItem'

export function Rundown () {
  const [shared] = React.useContext(SharedContext)
  const [store] = React.useContext(StoreContext)

  const [contextPos, setContextPos] = React.useState()

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleItemOnClick (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    bridge.commands.executeCommand('rundown.appendItem', store?.id, itemId)
  }

  return (
    <div className='View' onContextMenu={e => handleContextMenu(e)}>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Add'>
                {
                  Object.values(shared?._types || {})
                    .filter(type => type.name)
                    .map(type => {
                      return <ContextMenuItem key={type.id} text={type.name} onClick={() => handleItemOnClick(type.id)} />
                    })
                }
              </ContextMenuItem>
            </ContextMenu>
            )
          : <></>
      }
      <RundownList />
    </div>
  )
}
