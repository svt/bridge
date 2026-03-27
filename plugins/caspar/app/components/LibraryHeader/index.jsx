import React from 'react'
import './style.css'

import { ServerSelector } from '../ServerSelector'

export const LibraryHeader = ({ filter = {}, onChange = () => {} }) => {
  function handleFilterValue (key, value) {
    const newFilter = {
      ...filter,
      [key]: value
    }
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
      <div className='LibraryHeader-refresh'>
        <button className='Button Button--small' onClick={() => handleFilterValue('refresh', Math.floor(Math.random() * 100))}>Refresh</button>
      </div>
    </header>
  )
}
