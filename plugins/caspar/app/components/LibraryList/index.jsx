import React from 'react'
import './style.css'

import { LibraryListItem } from '../LibraryListItem'

export const LibraryList = ({ items = [], highlightItem, onItemClick, onItemDoubleClick }) => {
  const listRef = React.useRef()
  const highlightedRef = React.useRef()
  const [focusedIndex, setFocusedIndex] = React.useState(null)

  React.useEffect(() => {
    if (!highlightItem) {
      return
    }
    const index = items.findIndex(item => item.name === highlightItem)
    if (index !== -1) {
      setFocusedIndex(index)
    }
    highlightedRef.current?.scrollIntoView({ block: 'nearest' })
  }, [items, highlightItem])

  React.useEffect(() => {
    if (focusedIndex === null) {
      return
    }
    listRef.current?.children[focusedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  function handleKeyDown (e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIndex(i => Math.min((i ?? -1) + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIndex(i => Math.max((i ?? items.length) - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      listRef.current?.children[focusedIndex]?.click()
    }
  }

  return (
    <ul ref={listRef} className='LibraryList' tabIndex={0} onKeyDown={handleKeyDown}>
      {
        (items || []).map((item, i) => {
          const isHighlighted = highlightItem && item.name === highlightItem
          return (
            <LibraryListItem
              key={i}
              item={item}
              isHighlighted={isHighlighted}
              isFocused={i === focusedIndex}
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
