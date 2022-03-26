/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

import React from 'react'
import bridge from 'bridge'

/**
 * A context for being shared
 * across active clients
 *
 * @see {@link ./App.js}
 *
 * @type { React.Context }
 */
export const SharedContext = React.createContext()

export const SharedContextProvider = ({ children }) => {
  const [state, setState] = React.useState()

  /*
  Fetch the state directly
  on context load
  */
  React.useEffect(() => {
    async function initState () {
      const state = await bridge.state.get()
      setState(state)
    }
    initState()
  }, [])

  /*
  Listen for changes to the state
  and update the context accordingly
  */
  React.useEffect(() => {
    function onStateChange (state) {
      setState(state)
    }
    bridge.events.on('state.change', onStateChange)
    return () => bridge.events.off('state.change', onStateChange)
  }, [])

  return (
    <SharedContext.Provider value={[state, bridge.state.apply]}>
      {children}
    </SharedContext.Provider>
  )
}
