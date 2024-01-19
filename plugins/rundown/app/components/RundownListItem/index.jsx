import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { ContextMenu } from '../../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../../app/components/ContextMenuDivider'

import { ContextAddMenu } from '../ContextAddMenu'

import * as clipboard from '../../utils/clipboard'

const INDICATE_PLAYING_TIMEOUT_MS = 500

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
  const [selection, setSelection] = React.useState([])

  const [indicateIsPlaying, setIndicateIsPlaying] = React.useState(false)

  React.useEffect(() => {
    async function updateSelection () {
      const selection = await bridge.client.getSelection()
      setSelection(selection)
    }
    updateSelection()
  }, [state])

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
    e.stopPropagation()
    setContextPos([e.pageX, e.pageY])
  }

  function handleDelete (ids) {
    bridge.items.deleteItems(ids)
  }

  async function handleCopy (ids) {
    const string = await bridge.commands.executeCommand('rundown.copyItems', ids)
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

    setTimeout(() => {
      setIndicateIsPlaying(false)
    }, INDICATE_PLAYING_TIMEOUT_MS)

    setIndicateIsPlaying(true)
  }, [item?.state, item?.didStartPlayingAt])

  async function handlePaste () {
    const items = await clipboard.readJson()
    bridge.commands.executeCommand('rundown.pasteItems', items, rundownId, index + 1)
  }

  return (
    <div
      className={`RundownListItem ${isDraggedOver ? 'is-draggedOver' : ''} ${isSelected ? 'is-selected' : ''}`}
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
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Copy' onClick={() => handleCopy(selection)} />
              {
                selection.length <= 1 &&
                <ContextMenuItem text='Copy id' onClick={() => handleCopyId()} />
              }
              <ContextMenuItem text='Paste' onClick={() => handlePaste()} />
              <ContextMenuDivider />
              <ContextMenuItem text='Add after'>
                <ContextAddMenu onAdd={newItemId => handleAdd(newItemId)} />
              </ContextMenuItem>
              <ContextMenuItem text='Create reference' onClick={() => handleCreateReference()} />
              <ContextMenuDivider />
              <ContextMenuItem text='Remove' onClick={() => handleDelete(selection)} />
              {
                ExtraContextItemsComponent &&
                selection.length <= 1 && (
                  <>
                    <ContextMenuDivider />
                    <ExtraContextItemsComponent item={item} />
                  </>
                )
              }
            </ContextMenu>
            )
          : <></>
      }
      {children}
    </div>
  )
}
