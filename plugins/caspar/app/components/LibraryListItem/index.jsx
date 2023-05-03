import React from 'react'
import './style.css'

export const LibraryListItem = ({ item = {} }) => {
  return (
    <li className='LibraryListItem'>
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
