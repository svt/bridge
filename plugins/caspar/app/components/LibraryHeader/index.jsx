import React from 'react'
import './style.css'

import { ServerSelector } from '../ServerSelector'

export const LibraryHeader = ({ onChange = () => {} }) => {
  const [filter, setFilter] = React.useState({})

  function handleFilterValue (key, value) {
    const newFilter = {
      ...filter,
      [key]: value
    }
    setFilter(newFilter)
    onChange(newFilter)
  }

  return (
    <header className='LibraryHeader'>
      <div className='LibraryHeader-serverSelector'>
        <ServerSelector
          value={filter?.serverId}
          onChange={serverId => handleFilterValue('serverId', serverId)}
        />
      </div>
      <div className='LibraryHeader-search'>
        <input
          type='search'
          placeholder='&#xe900; Search for media'
          value={filter?.query || ''}
          onChange={e => handleFilterValue('query', e.target.value)}
        />
      </div>
    </header>
  )
}
