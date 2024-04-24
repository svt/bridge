import React from 'react'
import './style.css'

export const ItemDropArea = ({ children, onDrop = () => {} }) => {
  const [isDraggedOver, setIsDraggedOver] = React.useState()
  
  function handleDragOver (e) {
    e.preventDefault()
    setIsDraggedOver(true)
  }

  function handleDragLeave (e) {
    e.stopPropagation()
    setIsDraggedOver(false)
  }

  function handleDrop (e) {
    e.stopPropagation()
    setIsDraggedOver(false)

    const itemId = e.dataTransfer.getData('text/plain')
    const item = e.dataTransfer.getData('bridge/item')
    if (!itemId && !item?.id) {
      return
    }

    onDrop(itemId || item?.id)
  }

  return (
    <div
      className='ItemDropArea'
      onDragOver={handleDragOver}
    >
      {
        isDraggedOver &&
        (
          <div
            className='ItemDropArea-dropArea'
            onDrop={handleDrop}
            onDragLeave={handleDragLeave}
          />
        )
      }
      {children}
    </div>
  )
}
