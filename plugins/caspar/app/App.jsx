import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

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
            case 'settings/servers':
              return <Settings.Servers />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
