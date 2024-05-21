import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

import { InspectorDevice } from './views/InspectorDevice'

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
            case 'inspector/device':
              return <InspectorDevice />
            case 'settings/devices':
              return <Settings.Devices />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
