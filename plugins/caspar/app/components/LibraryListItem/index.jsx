import React from 'react'
import './style.css'

const DEFAULT_DURATION_S = 5

export const LibraryListItem = ({ item = {} }) => {
  async function handleDragStart (e) {
    e.dataTransfer.setData('itemSpec', JSON.stringify({
      type: 'bridge.caspar.media',
      data: {
        name: item.name,
        caspar: {
          target: item.name
        },
        timing: {
          duration: (item?.duration ?? DEFAULT_DURATION_S) * 1000
        }
      }
    }))
    e.stopPropagation()
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
