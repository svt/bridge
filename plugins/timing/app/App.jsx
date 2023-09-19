import React from 'react'
import bridge from 'bridge'

import { List } from './components/List'
import { Item } from './components/Item'

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
    <div className='Timing-wrapper'>
      <List>
        {
          (state?._tmp?.['bridge-plugin-timing']?.items || [])
            .map((item, i) => {
              return <Item key={i} data={item} />
            })
        }
      </List>
    </div>
  )
}
