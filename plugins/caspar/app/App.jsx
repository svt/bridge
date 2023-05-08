import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

import { InspectorServer } from './views/InspectorServer'
import { InspectorTransition } from './views/InspectorTransition'

import { Library } from './views/Library'
import { Status } from './views/Status'

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
            case 'inspector/server':
              return <InspectorServer />
            case 'inspector/transition':
              return <InspectorTransition />
            case 'settings/servers':
              return <Settings.Servers />
            case 'status':
              return <Status />
            case 'library':
              return <Library />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
