import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { ContextMenu } from '../../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../../app/components/ContextMenuDivider'

import { ContextAddMenu } from '../ContextAddMenu'

import * as clipboard from '../../utils/clipboard'
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

export function RundownListItem ({
  children,
  item,
  index,
  rundownId,
  onDrop = () => {},
  onFocus = () => {},
  onMouseDown = () => {},
  extraContextItems: ExtraContextItemsComponent,
  selected: isSelected
}) {
  const [state] = React.useContext(SharedContext)

  const [isDraggedOver, setIsDraggedOver] = React.useState(false)
  const [contextPos, setContextPos] = React.useState()

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

  function handleContextMenu (e) {
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

    setContextPos([e.pageX, e.pageY])
  }

  async function handleDelete () {
    const selection = await bridge.client.getSelection()
    bridge.items.deleteItems(selection)
  }

  async function handleCopy () {
    const selection = await bridge.client.getSelection()
    const string = await bridge.commands.executeCommand('rundown.copyItems', selection)
    clipboard.copyText(string)
  }

  function handleCopyId () {
    const string = item.id
    clipboard.copyText(string)
  }

  function handleAdd (newItemId) {
    bridge.commands.executeCommand('rundown.moveItem', rundownId, index + 1, newItemId)
  }

  async function handleCreateReference () {
    const newItemId = await bridge.items.createItem('bridge.types.reference')

    await bridge.items.applyItem(newItemId, {
      data: {
        name: `Reference to ${item?.data?.name}`,
        targetId: item.id
      }
    })

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
    const items = await clipboard.readJson()
    bridge.commands.executeCommand('rundown.pasteItems', items, rundownId, index + 1)
  }

  const multipleItemsSelected = React.useMemo(() => {
    return (state?._connections?.[bridge.client.getIdentity()]?.selection || []).length > 1
  }, [state])

  const isLastPlayed = React.useMemo(() => {
    return (state?.plugins?.['bridge-plugin-rundown']?.lastPlayedItems || {})[item.id]
  }, [state, item])

  return (
    <div
      ref={elRef}
      className={`RundownListItem ${isDraggedOver ? 'is-draggedOver' : ''} ${isSelected ? 'is-selected' : ''} ${item?.data?.disabled ? 'is-disabled' : ''}`}
      onFocus={e => onFocus(e)}
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
      {
        contextPos &&
        (
          <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
            <ContextMenuItem text='Copy' onClick={() => handleCopy()} />
            {
              !multipleItemsSelected &&
              <ContextMenuItem text='Copy id' onClick={() => handleCopyId()} />
            }
            <ContextMenuItem text='Paste' onClick={() => handlePaste()} />
            <ContextMenuDivider />
            <ContextMenuItem text='Add after'>
              <ContextAddMenu onAdd={newItemId => handleAdd(newItemId)} />
            </ContextMenuItem>
            <ContextMenuItem text='Create reference' onClick={() => handleCreateReference()} />
            <ContextMenuItem text={item?.data?.disabled ? 'Enable' : 'Disable'} onClick={() => selection.disableSelection(!item?.data?.disabled)} />
            <ContextMenuDivider />
            <ContextMenuItem text='Remove' onClick={() => handleDelete()} />
            {
              ExtraContextItemsComponent &&
              !multipleItemsSelected && (
                <>
                  <ContextMenuDivider />
                  <ExtraContextItemsComponent item={item} />
                </>
              )
            }
          </ContextMenu>
        )
      }
      {children}
      {
        isLastPlayed &&
          <div className='RundownListItem-lastPlayed' />
      }
    </div>
  )
}
