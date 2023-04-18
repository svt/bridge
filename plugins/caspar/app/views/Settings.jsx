import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

import { ServerInput } from '../components/ServerInput'

const PLUGIN_NAME = 'bridge.plugins.caspar'

export const Servers = () => {
  const [state] = React.useContext(SharedContext)
  const servers = state?.settings?.[PLUGIN_NAME]?.servers || []

  function handleChange (i, newData) {
    const set = servers
    set[i] = newData

    bridge.state.apply({
      settings: {
        [PLUGIN_NAME]: {
          servers: { $replace: set }
        }
      }
    })
  }

  function handleDelete (i) {
    const set = servers
    set.splice(i, 1)

    bridge.state.apply({
      settings: {
        [PLUGIN_NAME]: {
          servers: { $replace: set }
        }
      }
    })
  }

  function handleNew () {
    if (servers.length === 0) {
      // Create an array with an empty server object
      bridge.state.apply({
        settings: {
          [PLUGIN_NAME]: {
            servers: [{}]
          }
        }
      })
    } else {
      // Append an empty server object to the array
      bridge.state.apply({
        settings: {
          [PLUGIN_NAME]: {
            servers: { $push: [{}] }
          }
        }
      })
    }
  }

  return (
    <div>
      {
        (servers || []).map((server, i) => {
          return <ServerInput data={server} onChange={newData => handleChange(i, newData)} onDelete={() => handleDelete(i)} />
        })
      }
      <button className='Button' onClick={() => handleNew()}>New server</button>
    </div>
  )
}
