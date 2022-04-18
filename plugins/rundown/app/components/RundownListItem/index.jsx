import React from 'react'
import bridge from 'bridge'

import './style.css'

import { StoreContext } from '../../storeContext'

import { ContextMenu } from '../../../../../app/components/ContextMenu'
import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'
import { ContextMenuDivider } from '../../../../../app/components/ContextMenuDivider'

export function RundownListItem ({ children, item, onDrop = () => {} }) {
  const [store] = React.useContext(StoreContext)

  const [isDraggedOver, setIsDraggedOver] = React.useState(false)
  const [contextPos, setContextPos] = React.useState()

  function removeItemFromRundown (id) {
    bridge.commands.executeCommand('rundown.removeItem', store?.id, id)
  }

  function resetContextMenu () {
    setContextPos(undefined)
  }

  function handleDragOver (e) {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    setIsDraggedOver(false)
  }

  function handleDragStart (e) {
    e.dataTransfer.setData('itemId', item.id)
  }

  function handleDrop (e) {
    setIsDraggedOver(false)

    const itemId = e.dataTransfer.getData('itemId')
    onDrop(e, itemId)
  }

  function handleContextMenu (e) {
    e.preventDefault()
    e.stopPropagation()
    setContextPos([e.pageX, e.pageY])
  }

  function handleRemoveFromRundown (id) {
    removeItemFromRundown(id)
  }

  function handleDelete (id) {
    removeItemFromRundown(id)
    bridge.items.deleteItem(id)
  }

  /**
   * Close the context menu whenever
   * something is clicked
   */
  React.useEffect(() => {
    window.addEventListener('click', resetContextMenu)
    return () => window.removeEventListener('click', resetContextMenu)
  }, [resetContextMenu])

  return (
    <>
      {
        contextPos
          ? (
            <ContextMenu x={contextPos[0]} y={contextPos[1]} onClose={() => setContextPos(undefined)}>
              <ContextMenuItem text='Remove que' onClick={() => handleRemoveFromRundown(item.id)} />
              <ContextMenuDivider />
              <ContextMenuItem text='Delete item from workspace' onClick={() => handleDelete(item.id)} />
            </ContextMenu>
            )
          : <></>
      }
      <div
        className={`RundownListItem ${isDraggedOver ? 'is-draggedOver' : ''}`}
        onDrop={(e, data) => handleDrop(e, data)}
        onDragOver={e => handleDragOver(e)}
        onDragLeave={e => handleDragLeave(e)}
        onDragStart={e => handleDragStart(e)}
        onContextMenu={e => handleContextMenu(e)}
        draggable
      >
        {children}
      </div>
    </>
  )
}
