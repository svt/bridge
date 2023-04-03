import React from 'react'
import bridge from 'bridge'
import ReactJson from 'react-json-view'

function getCSSVar (variableName) {
  return getComputedStyle(document.body).getPropertyValue(variableName)
}

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
      <ReactJson
        src={state}
        theme={{
          base00: 'transparent',
          base01: getCSSVar('--base-color'),
          base02: getCSSVar('--base-color'),
          base03: getCSSVar('--base-color'),
          base04: getCSSVar('--base-color'),
          base05: getCSSVar('--base-color'),
          base06: getCSSVar('--base-color'),
          base07: getCSSVar('--base-color'),
          base08: getCSSVar('--base-color'),
          base09: getCSSVar('--base-color'),
          base0A: getCSSVar('--base-color'),
          base0B: getCSSVar('--base-color'),
          base0C: getCSSVar('--base-color'),
          base0D: getCSSVar('--base-color'),
          base0E: getCSSVar('--base-color'),
          base0F: getCSSVar('--base-color')
        }}
        collapsed={true}
      />
    </div>
  )
}
