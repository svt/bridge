import React from 'react'
import './style.css'

export function RundownItem ({ index, item, onDrop = () => {} }) {
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)

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

  return (
    <div
      className={`RundownItem ${isDraggedOver ? 'is-draggedOver' : ''}`}
      onDrop={(e, data) => handleDrop(e, data)}
      onDragOver={e => handleDragOver(e)}
      onDragLeave={e => handleDragLeave(e)}
      onDragStart={e => handleDragStart(e)}
      draggable
    >
      <div className='RundownItem-index'>
        {index}
      </div>
      <div className='RundownItem-name'>
        {item.id}
      </div>
    </div>
  )
}
