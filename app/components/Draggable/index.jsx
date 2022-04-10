import React from 'react'

export function Draggable ({
  className,
  children,
  item = {},
  onDrop = (e, data) => {},
  onDragOver = e => {},
  onDragLeave = e => {}
}) {
  function handleDrop (e) {
    onDrop(e, JSON.parse(e.dataTransfer.getData('data')))
  }

  function handleDragOver (e) {
    e.preventDefault()
    onDragOver(e)
  }

  function handleDragLeave (e) {
    onDragLeave(e)
  }

  function handleDragStart (e) {
    e.dataTransfer.setData('data', JSON.stringify({
      item
    }))
  }

  return (
    <div
      className={className}
      onDragStart={e => handleDragStart(e)}
      onDragLeave={e => handleDragLeave(e)}
      onDragOver={e => handleDragOver(e)}
      onDrop={e => handleDrop(e)}
      draggable
    >
      {children}
    </div>
  )
}
