import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { ServerInput } from '../components/ServerInput'

export const Servers = () => {
  const [state] = React.useContext(SharedContext)
  const servers = state?.plugins?.[window.PLUGIN.name]?.servers || []

  function handleChange (serverId, newData) {
    bridge.commands.executeCommand('caspar.server.edit', serverId, newData)
  }

  function handleDelete (serverId) {
    bridge.commands.executeCommand('caspar.server.remove', serverId)
  }

  function handleNew () {
    bridge.commands.executeCommand('caspar.server.add', {})
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
