import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'
import { SMPTE } from './views/SMPTE'

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
            case 'widget/smpte':
              return <SMPTE />
            case 'settings/ltc-inputs':
              return <Settings.LTCInputs />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
