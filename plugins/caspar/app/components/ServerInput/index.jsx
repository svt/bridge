import React from 'react'
import './style.css'

import bridge from 'bridge'

import { ServerStatusBadge } from '../ServerStatusBadge'

export const ServerInput = ({ data = {}, onChange = () => {}, onDelete = () => {} }) => {
  function handleInput (key, newValue) {
    onChange({
      ...data,
      [key]: newValue
    })
  }

  function handleDelete () {
    onDelete()
  }

  function handleConnect () {
    bridge.commands.executeCommand('caspar.server.connect', data.id, {
      host: data.host,
      port: data.port
    })
  }

  return (
    <div className='ServerInput'>
      <div className='ServerInput-flexWrapper'>
        <div>
          <div className='ServerInput-input'>
            <input type='text' value={data.name || ''} placeholder='Name' onChange={e => handleInput('name', e.target.value)}></input>
          </div>
          <div className='ServerInput-input'>
            <div className='ServerInput-flexInputs'>
              <input type='text' value={data.host || ''} placeholder='Host' onChange={e => handleInput('host', e.target.value)}></input>
              <input type='number' className='ServerInput-input--small' value={data.port || ''} placeholder='Port' onChange={e => handleInput('port', e.target.value)}></input>
            </div>
          </div>
          <div className='ServerInput-input'>
            <select className='Select--small' value={data?.group || '-1'} onChange={e => handleInput('group', e.target.value)}>
              <option value='-1'>No group</option>
              <option value='0'>Primary</option>
              <option value='1'>Secondary</option>
            </select>
          </div>
        </div>
        <div>
          <button className='Button Button--ghost' onClick={() => handleDelete()}>Delete</button><br/>
          <button className='Button Button--ghost' onClick={() => handleConnect()}>Connect</button>
        </div>
      </div>
      <div className='ServerInput-input ServerInput-status'>
        <ServerStatusBadge serverId={data.id} />
      </div>
    </div>
  )
}
