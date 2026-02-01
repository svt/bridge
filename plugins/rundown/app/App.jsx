import React from 'react'

import { SharedContextProvider } from './sharedContext'

import { Header } from './components/Header'
import { Rundown } from './views/Rundown'

export default function App () {
  const [view, setView] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('path'))
  }, [])

  return (
    <SharedContextProvider>
      {
        (function () {
          switch (view) {
            case 'rundown':
              return (
                <div className='App'>
                  <Header />
                  <Rundown />
                </div>
              )
            default:
              return <></>
          }
        })()
      }
    </SharedContextProvider>
  )
}
