import React from 'react'
import './style.css'

import { ServerSelector } from '../ServerSelector'

import * as filterUtils from '../../utils/filter'

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
      <div className='LibraryHeader-section'>
        {/* 
          Server selector
        */}
        <div className='LibraryHeader-select'>
          <ServerSelector
            value={filter?.serverId}
            onChange={serverId => handleFilterValue('serverId', serverId)}
        />
        </div>

        {/* 
          Type selector
        */}
        <div className='LibraryHeader-select'>
          <select className='Select Select--small' value={filter?.type || filterUtils.DEFAULT_TYPES_STR} onChange={e => handleFilterValue('type', e.target.value)}>
            <option value={filterUtils.ALL_TYPES_STR}>All</option>
            <option value='video'>Video</option>
            <option value='audio'>Audio</option>
            <option value='still'>Stills</option>
            <option value='template'>Templates</option>
          </select>
        </div>
      </div>
      <div className='LibraryHeader-section'>
        <div className='LibraryHeader-search'>
          <input
            type='search'
            placeholder='&#xe900; Search for items'
            value={filter?.query || ''}
            onChange={e => handleFilterValue('query', e.target.value)}
          />
        </div>
        <div className='LibraryHeader-refresh'>
          <button
            className='Button Button--small'
            onClick={() => handleFilterValue('refresh', Math.floor(Math.random() * 100))}
          >
            Refresh
          </button>
        </div>
      </div>
    </header>
  )
}
