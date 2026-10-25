import React from 'react'

import './style.css'

import { Icon } from '../../../../../app/components/Icon'

/**
 * Shares the active search query with
 * nested lists, such as those in groups
 */
export const RundownSearchContext = React.createContext('')

/**
 * Check if an item matches a search query
 * by its name, notes or id
 * @param { Object } item
 * @param { String } query
 * @returns { Boolean }
 */
export function itemMatchesQuery (item, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) {
    return true
  }

  return [item?.data?.name, item?.data?.notes, item?.id]
    .some(value => typeof value === 'string' && value.toLowerCase().includes(needle))
}

export function RundownSearch ({
  query = '',
  onChange = () => {},
  onClose = () => {}
}) {
  const inputRef = React.useRef()

  React.useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  function handleKeyDown (e) {
    /*
    Keep the list from handling
    keys meant for the input
    */
    e.stopPropagation()

    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div className='RundownSearch' onKeyDown={handleKeyDown}>
      <input
        ref={inputRef}
        className='Input RundownSearch-input'
        type='text'
        placeholder='Find'
        value={query}
        onChange={e => onChange(e.target.value)}
      />
      <button className='RundownSearch-close' title='Close' onClick={() => onClose()}>
        <Icon name='close' />
      </button>
    </div>
  )
}
