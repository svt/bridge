import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'
import { LiveSwitchControl } from '../components/LiveSwitchControl'

export const LiveSwitch = () => {
  const [state] = React.useContext(SharedContext)
  const isLive = state?.plugins?.[window.PLUGIN.name]?.isLive ?? true

  function handleNewValue (newValue) {
    bridge.state.apply({
      plugins: {
        [window.PLUGIN.name]: {
          isLive: newValue
        }
      }
    })
  }

  return (
    <LiveSwitchControl value={isLive} onChange={newValue => handleNewValue(newValue)} />
  )
}
