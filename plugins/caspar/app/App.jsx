import React from 'react'

import * as SharedContext from './sharedContext'
import * as Settings from './views/Settings'

import { InspectorServer } from './views/InspectorServer'
import { InspectorTarget } from './views/InspectorTarget'
import { InspectorTemplate } from './views/InspectorTemplate'
import { InspectorTransition } from './views/InspectorTransition'

import { LibraryModal } from './views/LibraryModal'
import { Library } from './views/Library'

import { LiveSwitch } from './views/LiveSwitch'
import { Thumbnail } from './views/Thumbnail'
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
            case 'inspector/target':
              return <InspectorTarget />
            case 'inspector/transition':
              return <InspectorTransition />
            case 'inspector/template':
              return <InspectorTemplate />
            case 'settings/servers':
              return <Settings.Servers />
            case 'liveSwitch':
              return <LiveSwitch />
            case 'thumbnail':
              return <Thumbnail />
            case 'status':
              return <Status />
            case 'library':
              return <Library />
            case 'library/modal':
              return <LibraryModal />
            default:
              return <></>
          }
        })()
      }
    </SharedContext.Provider>
  )
}
