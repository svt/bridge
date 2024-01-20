import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

import { RundownList } from '../components/RundownList'
import { ContextAddMenu } from '../components/ContextAddMenu'

import { ContextMenu } from '../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../app/components/ContextMenuDivider'

import * as config from '../config'
import * as clipboard from '../utils/clipboard'

export function Rundown () {
  const [shared] = React.useContext(SharedContext)
  const [contextPos, setContextPos] = React.useState()

  const elRef = React.useRef()

  const rundownId = window.WIDGET_DATA?.['rundown.id'] || config.DEFAULT_RUNDOWN_ID

  function handleContextMenu (e) {
    e.preventDefault()
    setContextPos([e.pageX, e.pageY])
  }

  async function handleItemCreate (itemId) {
    bridge.commands.executeCommand('rundown.appendItem', rundownId, itemId)
  }

  /**
   * Get the last rendered item from a set,
   * this function utilizes the dom as provided
   * items may belong to different parents
   * @param { String[] } itemIds 
   * @returns { String | undefined }
   */
  function getLastRenderedItemOfSet (itemIds = []) {
    if (!elRef.current) {
      return undefined
    }

    if (!Array.isArray(itemIds)) {
      return undefined
    }
    
    /*
    Find all items that are currently rendered in the dom,
    as the provided ids may belong to different parents

    Use the data-item-id that's rendered by
    the RundownListItem component
    */
    const order = Array.from(elRef.current.querySelectorAll('[data-item-id]'))

      /*
      Limit the items to only relevant
      ones as early as possible
      */
      .filter(item => itemIds.includes(item.dataset['itemId']))
      .map(item =>item.dataset['itemId'])

    return order[order.length - 1]
  }

  async function handlePaste () {
    const items = await clipboard.readJson()
    const selection = await bridge.client.getSelection()

    /*
    Paste the items into the
    selected item's parent
    */
    if (selection.length) {
      const lastItemId = getLastRenderedItemOfSet(selection)

      if (!lastItemId) {
        return
      }

      const lastItem = await bridge.items.getItem(lastItemId)
      const siblings = shared?.items?.[lastItem.parent]?.children || []

      const lastItemIndexInParent = siblings.indexOf(lastItem?.id)

      bridge.commands.executeCommand('rundown.pasteItems', items, lastItem.parent, lastItemIndexInParent + 1)
    
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
  }, [rundownId, shared])

  return (
    <div ref={elRef} className='View' onContextMenu={e => handleContextMenu(e)}>
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
