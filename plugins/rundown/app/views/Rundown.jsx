import React from 'react'
import bridge from 'bridge'

import { RundownList } from '../components/RundownList'
import { ContextAddMenu } from '../components/ContextAddMenu'

import { ContextMenu } from '../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../app/components/ContextMenuItem'

import * as config from '../config'

export function Rundown () {
  const [contextPos, setContextPos] = React.useState()

  const rundownId = window.WIDGET_DATA?.['rundown.id'] || config.DEFAULT_RUNDOWN_ID

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleItemCreate (itemId) {
    bridge.commands.executeCommand('rundown.appendItem', rundownId, itemId)
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
      <RundownList rundownId={rundownId} />
    </div>
  )
}
