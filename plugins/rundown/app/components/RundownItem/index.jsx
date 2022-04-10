import React from 'react'
import './style.css'

import { Draggable } from '../../../../../app/components/Draggable'

export function RundownItem ({ index, item }) {
  const [isDraggedOver, setIsDraggedOver] = React.useState(false)

  function handleDragOver (e) {
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    setIsDraggedOver(false)
  }

  function handleDrop (e, data) {
    setIsDraggedOver(false)
  }

  return (
    <Draggable
      className={`RundownItem ${isDraggedOver ? 'is-draggedOver' : ''}`}
      item={item}
      onDrop={(e, data) => handleDrop(e, data)}
      onDragOver={e => handleDragOver(e)}
      onDragLeave={e => handleDragLeave(e)}
    >
      <div className='RundownItem-index'>
        {index}
      </div>
      <div className='RundownItem-name'>
        {item.name}
      </div>
    </Draggable>
  )
}
