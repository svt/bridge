import React from 'react'
import bridge from 'bridge'

import { TreeView } from './components/TreeView'

export default function App () {
  const [state, setState] = React.useState({})

  React.useEffect(() => {
    async function initState () {
      const state = await bridge.state.get()
      setState(state)
    }
    initState()
  }, [])

  /*
  Listen for changes to the state
  and update the state accordingly
  */
  React.useEffect(() => {
    function onStateChange (state) {
      setState({ ...state })
    }
    bridge.events.on('state.change', onStateChange)
    return () => bridge.events.off('state.change', onStateChange)
  }, [])

  return (
    <div className='App'>
      <TreeView data={state} />
    </div>
  )
}
