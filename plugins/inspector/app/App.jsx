import React from 'react'
import bridge from 'bridge'

import { SharedContext } from './sharedContext'
import { StoreContext } from './storeContext'

import { Inspector } from './views/Inspector'

export default function App () {
  const [store, setStore] = React.useState()
  const [state, setState] = React.useState()

  const storeRef = React.useRef()

  React.useEffect(() => {
    storeRef.current = store
  }, [store])

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
      setState({ ...state })
    }
    bridge.events.on('state.change', onStateChange)
    return () => bridge.events.off('state.change', onStateChange)
  }, [])

  /*
  Keep the current selection in
  the store context for simplicity
  throughout the plugin
  */
  const selection = state?._connections?.[bridge.client.getIdentity()]?.selection

  React.useEffect(() => {
    const items = (selection || [])
      .map(id => bridge.items.getLocalItem(id))
      .filter(item => item)

    setStore({
      ...storeRef.current,
      selection,
      items
    })
  }, [selection, state])

  return (
    <SharedContext.Provider value={[state, bridge.state.apply]}>
      <StoreContext.Provider value={[store, setStore]}>
        <div className='App'>
          <Inspector />
        </div>
      </StoreContext.Provider>
    </SharedContext.Provider>
  )
}
