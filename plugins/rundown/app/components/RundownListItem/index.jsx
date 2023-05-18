import React from 'react'
import bridge from 'bridge'

import './style.css'

import { ContextMenu } from '../../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../../app/components/ContextMenuDivider'

import { ContextAddMenu } from '../ContextAddMenu'

import * as clipboard from '../../utils/clipboard'

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
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)
  const [contextPos, setContextPos] = React.useState()

  function handleDragOver (e) {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    setIsDraggedOver(false)
  }

  function handleDragStart (e) {
    e.dataTransfer.setData('itemId', item.id)
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

  async function handleCopy () {
    const items = bridge.client.getSelection()
    const string = await bridge.commands.executeCommand('rundown.copyItems', items)
    clipboard.copyText(string)
  }

  function handleCopyId () {
    const string = item.id
    clipboard.copyText(string)
  }

  function handleAdd (newItemId) {
    bridge.commands.executeCommand('rundown.moveItem', rundownId, index + 1, newItemId)
  }

  return (
    <div
      className={`RundownListItem ${isDraggedOver ? 'is-draggedOver' : ''} ${isSelected ? 'is-selected' : ''}`}
      onFocus={e => onFocus(e)}
      onDrop={(e, data) => handleDrop(e, data)}
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
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Copy' onClick={() => handleCopy()} />
              {
                bridge.client.getSelection().length <= 1 &&
                <ContextMenuItem text='Copy id' onClick={() => handleCopyId()} />
              }
              <ContextMenuDivider />
              <ContextMenuItem text='Add after'>
                <ContextAddMenu onAdd={newItemId => handleAdd(newItemId)} />
              </ContextMenuItem>
              <ContextMenuDivider />
              <ContextMenuItem text='Remove' onClick={() => handleDelete(bridge.client.getSelection())} />
              {
                ExtraContextItemsComponent &&
                bridge.client.getSelection().length <= 1 && (
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
