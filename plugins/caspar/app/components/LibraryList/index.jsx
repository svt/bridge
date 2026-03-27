import React from 'react'
import './style.css'

import { LibraryListItem } from '../LibraryListItem'

export const LibraryList = ({ items = [], highlightItem, onItemClick, onItemDoubleClick }) => {
  const highlightedRef = React.useRef()

  React.useEffect(() => {
    if (!highlightItem) {
      return
    }
    highlightedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [items, highlightItem])

  return (
    <ul className='LibraryList'>
      {
        (items || []).map((item, i) => {
          const isHighlighted = highlightItem && item.name === highlightItem
          return (
            <LibraryListItem
              key={i}
              item={item}
              isHighlighted={isHighlighted}
              itemRef={isHighlighted ? highlightedRef : undefined}
              onClick={onItemClick}
              onDoubleClick={onItemDoubleClick}
            />
          )
        })
      }
    </ul>
  )
}
