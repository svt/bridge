import React from 'react'
import bridge from 'bridge'

import { SharedContext } from './sharedContext'
import { StoreContext } from './storeContext'

import { Header } from './components/Header'
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
  const selection = state?.[bridge.client.getIdentity()]?.selection

  React.useEffect(() => {
    setStore({
      ...storeRef.current,
      selection
    })
  }, [selection])

  return (
    <SharedContext.Provider value={[state, bridge.state.apply]}>
      <StoreContext.Provider value={[store, setStore]}>
        <div className='App'>
          <Header />
          <Inspector />
        </div>
      </StoreContext.Provider>
    </SharedContext.Provider>
  )
}
