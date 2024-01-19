import React from 'react'
import bridge from 'bridge'

import { RundownList } from '../components/RundownList'
import { ContextAddMenu } from '../components/ContextAddMenu'

import { ContextMenu } from '../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../app/components/ContextMenuDivider'

import * as config from '../config'
import * as clipboard from '../utils/clipboard'

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

  async function handlePaste () {
    const items = await clipboard.readJson()
    const selection = await bridge.client.getSelection()

    /*
    Paste the items into the
    selected item's parent
    */
    if (selection.length) {
      const item = await bridge.items.getItem(selection[0])
      bridge.commands.executeCommand('rundown.pasteItems', items, item.parent)
    
    /*
    Paste the items into the current
    rundown if no item is selected
    */
    } else {
      bridge.commands.executeCommand('rundown.pasteItems', items, rundownId)
    }
  }

  React.useEffect(() => {
    function onShortcut (e) {
      switch (e.detail.id) {
        case 'paste':
          handlePaste()
          break
      }
    }
    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [rundownId])

  return (
    <div className='View' onContextMenu={e => handleContextMenu(e)}>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Paste' onClick={() => handlePaste()} />
              <ContextMenuDivider />
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
