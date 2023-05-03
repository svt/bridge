import React from 'react'
import './style.css'

import { LibraryListItem } from '../LibraryListItem'

export const LibraryList = ({ items = [] }) => {
  return (
    <ul className='LibraryList'>
      {
        (items || []).map((item, i) => {
          return <LibraryListItem key={i} item={item} />
        })
      }
    </ul>
  )
}
