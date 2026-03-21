import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import * as contextMenu from '../../utils/contextMenu'
import * as selection from '../../utils/selection'

const INDICATE_PLAYING_TIMEOUT_MS = 100

/**
 * Get the closest ancestor element
 * matching the specified CSS selector
 * @param { HTMLElement } el 
 * @param { String } selector 
 * @returns { HTMLElement | undefined }
 */
function getClosestAncestorWithSelector (el, selector) {
  if (!el) {
    return
  }
  if (!el.matches(selector)) {
    return getClosestAncestorWithSelector(el.parentElement, selector)
  }
  return el
}

async function isMultipleItemsSelected () {
  const selection = await bridge.client.selection.getSelection()
  return selection.length > 1
}

async function playSelectedItems () {
  const selection = await bridge.client.selection.getSelection()
  for (const item of selection) {
    bridge.items.playItem(item)
  }
}

async function stopSelectedItems () {
  const selection = await bridge.client.selection.getSelection()
  for (const item of selection) {
    bridge.items.stopItem(item)
  }
}

export function RundownListItem ({
  children,
  item,
  index,
  rundownId,
  onDrop = () => {},
  onFocus = () => {},
  onClick = () => {},
  onMouseDown = () => {},
  contextMenuItems: extraContextMenuItems,
  selected: isSelected
}) {
  const [state] = React.useContext(SharedContext)

  const [isDraggedOver, setIsDraggedOver] = React.useState(false)
  const [indicateIsPlaying, setIndicateIsPlaying] = React.useState(false)

  const elRef = React.useRef()

  function handleDragOver (e) {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    setIsDraggedOver(false)
  }

  function handleDragStart (e) {
    e.dataTransfer.setData('text/plain', item.id)
    e.stopPropagation()
  }

  function handleDrop (e) {
    setIsDraggedOver(false)
    onDrop(e)
  }

  async function handleContextMenu (e) {
    e.stopPropagation()
    e.preventDefault()

    /*
    Check if the rundown item that triggered the event is this item,
    if not, don't show the context menu

    This prevents a case where groups' context menus
    would render beneath the menus of the group's children
    */
    const targetItem = getClosestAncestorWithSelector(e.target, '.RundownListItem')
    if (targetItem !== elRef.current) {
      return
    }

    const multipleItemsSelected = await isMultipleItemsSelected()

    const types = await bridge.state.get('_types')

    const spec = [
      {
        type: 'item',
        label: 'Copy',
        onClick: () => handleCopy()
      },
      {
        ...(multipleItemsSelected ? {} : {
          type: 'item',
          label: 'Copy id',
          onClick: () => handleCopyId()
        })
      },
      {
        type: 'item',
        label: 'Paste',
        onClick: () => handlePaste()
      },
      { type: 'divider' },
      {
        type: 'item',
        label: 'Add after',
        children: contextMenu.generateAddContextMenuItems(types, typeId => handleAdd(typeId))
      },
      {
        type: 'item',
        label: 'Convert to',
        children: contextMenu.generateAddContextMenuItems(types, typeId => handleConvertTo(typeId))
      },
      {
        type: 'item',
        label: 'Create reference',
        onClick: () => handleCreateReference()
      },
      {
        type: 'item',
        label: item?.data?.disabled ? 'Enable' : 'Disable',
        onClick: () => selection.disableSelection(!item?.data?.disabled)
      },
      { type: 'divider' },
      {
        type: 'item',
        label: 'Play',
        onClick: () => playSelectedItems()
      },
      {
        type: 'item',
        label: 'Stop',
        onClick: () => stopSelectedItems()
      },
      { type: 'divider' },
      {
        type: 'item',
        label: 'Remove',
        onClick: () => handleDelete()
      },
      ...(
        !multipleItemsSelected && extraContextMenuItems
        ? [
          { type: 'divider' },
          ...extraContextMenuItems
        ]
        : []
      )
    ]

    bridge.ui.contextMenu.open(spec, {
      ...bridge.ui.contextMenu.getPositionFromEvent(e)
    })
  }

  async function handleDelete () {
    const selection = await bridge.client.selection.getSelection()
    bridge.items.deleteItems(selection)
  }

  async function handleCopy () {
    const selection = await bridge.client.selection.getSelection()
    const string = await bridge.commands.executeCommand('rundown.copyItems', selection)
    bridge.client.clipboard.writeText(string)
  }

  function handleCopyId () {
    const string = item.id
    bridge.client.clipboard.writeText(string)
  }

  async function handleAdd (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    bridge.commands.executeCommand('rundown.moveItem', rundownId, index + 1, itemId)
  }

  async function handleConvertTo (typeId) {
    if (!item?.id) {
      return
    }

    await bridge.items.applyItem(item?.id, {
      type: typeId
    }, true)
  }

  async function handleCreateReference () {
    const newItemId = await bridge.items.createItem('bridge.types.reference')

    await bridge.items.applyItem(newItemId, {
      data: {
        name: `Reference to ${item?.data?.name}`,
        targetId: item.id
      }
    }, true)

    bridge.commands.executeCommand('rundown.moveItem', rundownId, index + 1, newItemId)
  }

  React.useEffect(() => {
    if (item?.state == null) {
      return
    }

    const timeout = setTimeout(() => {
      setIndicateIsPlaying(false)
    }, INDICATE_PLAYING_TIMEOUT_MS)

    setIndicateIsPlaying(true)

    return () => {
      clearTimeout(timeout)
    }
  }, [item?.state, item?.didStartPlayingAt])

  async function handlePaste () {
    const items = await bridge.client.clipboard.readJson()
    bridge.commands.executeCommand('rundown.pasteItems', items, rundownId, index + 1)
  }

  const isLastPlayed = React.useMemo(() => {
    return (state?.plugins?.['bridge-plugin-rundown']?.lastPlayedItems || {})[item.id]
  }, [state, item])

  return (
    <div
      ref={elRef}
      className={`RundownListItem ${isDraggedOver ? 'is-draggedOver' : ''} ${isSelected ? 'is-selected' : ''} ${item?.data?.disabled ? 'is-disabled' : ''}`}
      onFocus={e => onFocus(e)}
      onClick={e => onClick(e)}
      onDrop={e => handleDrop(e)}
      onDragOver={e => handleDragOver(e)}
      onDragLeave={e => handleDragLeave(e)}
      onDragStart={e => handleDragStart(e)} 
      onMouseDown={e => onMouseDown(e)}
      onContextMenu={e => handleContextMenu(e)}
      /*
      This data property is used within RundownList
      to focus the correct element based on the
      selection of items
      */
      data-item-id={item.id}
      tabIndex={0}
      draggable
    >
      {
        indicateIsPlaying &&
          <div className='RundownListItem-playIndicator' />
      }
      {children}
      {
        isLastPlayed &&
          <div className='RundownListItem-lastPlayed' />
      }
    </div>
  )
}
