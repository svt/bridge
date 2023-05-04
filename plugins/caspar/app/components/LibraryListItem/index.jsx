import React from 'react'
import './style.css'

import bridge from 'bridge'

export const LibraryListItem = ({ item = {} }) => {
  async function handleDragStart (e) {
    e.dataTransfer.setData('itemSpec', JSON.stringify({
      type: 'bridge.caspar.amcp',
      data: {
        name: item.name
      }
    }))
    e.stopPropagation()
  }

  function handleDragEnd (e) {
    console.log(e)
  }

  return (
    <li className='LibraryListItem' onDragStart={e => handleDragStart(e)} onDragEnd={e => handleDragEnd(e)} draggable>
      <div className='LibraryListItem-name LibraryListItem-col'>
        {item?.name}
      </div>
      <div>
        <div className='LibraryListItem-col LibraryListItem-metadata'>
          {item?.type}
        </div>
      </div>
    </li>
  )
}
