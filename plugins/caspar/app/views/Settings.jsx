import React from 'react'
import bridge from 'bridge'

import { v4 } from 'uuid'

import { SharedContext } from '../sharedContext'
import { ServerInput } from '../components/ServerInput'

export const Servers = () => {
  const [state] = React.useContext(SharedContext)
  const servers = state?.plugins?.[window.PLUGIN.name]?.servers || []

  function handleChange (serverId, newData) {
    bridge.commands.executeCommand('caspar.editServer', serverId, newData)
  }

  function handleDelete (serverId) {
    bridge.commands.executeCommand('caspar.removeServer', serverId)
  }

  function handleNew () {
    bridge.commands.executeCommand('caspar.addServer', {
      id: v4()
    })
  }

  return (
    <div>
      {
        (servers || []).map((server, i) => {
          return <ServerInput key={server.id} data={server} onChange={newData => handleChange(server.id, newData)} onDelete={() => handleDelete(server.id)} />
        })
      }
      <button className='Button' onClick={() => handleNew()}>New server</button>
    </div>
  )
}
