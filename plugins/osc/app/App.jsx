import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

import { InspectorTarget } from './views/InspectorTarget'

export default function App () {
  const [view, setView] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('path'))
  }, [])

  return (
    <SharedContext.Provider>
      {
        (function () {
          switch (view) {
            case 'inspector/target':
              return <InspectorTarget />
            case 'settings/targets':
              return <Settings.Targets />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
