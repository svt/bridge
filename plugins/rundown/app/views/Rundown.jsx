import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { RundownList } from '../components/RundownList'

import * as contextMenu from '../utils/contextMenu'
import * as config from '../config'

const INITIAL_RUNDOWN_ID = window.WIDGET_DATA?.['rundown.id'] || config.DEFAULT_RUNDOWN_ID

export function Rundown () {
  const [rundownId, setRundownId] = React.useState(INITIAL_RUNDOWN_ID)
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()

  function handleNewRundownId (newId) {
    window.WIDGET_UPDATE({
      'rundown.id': newId
    })
    setRundownId(newId)
  }

  async function handleItemCreate (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    bridge.commands.executeCommand('rundown.appendItem', rundownId, itemId)
  }

  async function handleContextMenu (e) {
    e.preventDefault()

    const types = await bridge.state.get('_types')
    bridge.ui.contextMenu.open([
      {
        type: 'item',
        label: 'Paste',
        onClick: () => handlePaste()
      },
      { type: 'divider' },
      {
        type: 'item',
        label: 'Add',
        children: contextMenu.generateAddContextMenuItems(types, typeId => handleItemCreate(typeId))
      }
    ], {
      searchable: true,
      ...bridge.ui.contextMenu.getPositionFromEvent(e)
    })
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
      .map(item => item.dataset['itemId'])

    return order[order.length - 1]
  }

  async function handlePaste () {
    const items = await bridge.client.clipboard.readJson()
    const selection = await bridge.client.selection.getSelection()

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

  function handleSelectAll () {
    const elements = elRef.current.querySelectorAll('[data-item-id]')
    const ids = []

    for (const element of elements) {
      ids.push(element.dataset.itemId)
    }

    bridge.client.selection.setSelection(ids)
  }

  React.useEffect(() => {
    function onShortcut (shortcut) {
      /*
      Don't execute any shortcuts
      if the frame isn't focused
      */
      if (!window.bridgeFrameHasFocus) {
        return
      }

      switch (shortcut) {
        case 'paste':
          handlePaste()
          break
        case 'selectAll':
          handleSelectAll()
          break
      }
    }

    bridge.events.on('shortcut', onShortcut)
    return () => {
      bridge.events.off('shortcut', onShortcut)
    }
  }, [rundownId, shared])

  return (
    <div ref={elRef} className='View' onContextMenu={e => handleContextMenu(e)}>
      <RundownList
        rundownId={rundownId}
        onChangeRundownId={newId => handleNewRundownId(newId)}
      />
    </div>
  )
}
