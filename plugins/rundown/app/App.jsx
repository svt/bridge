import React from 'react'

import { SharedContextProvider } from './sharedContext'
import { StoreContext } from './storeContext'

import { Header } from './components/Header'
import { Rundown } from './views/Rundown'

const RUNDOWN_ID = 'BRIDGE_RUNDOWN_ROOT_1'

export default function App () {
  const [store, setStore] = React.useState()

  React.useEffect(() => {
    setStore({
      id: RUNDOWN_ID
    })
  }, [])

  return (
    <SharedContextProvider>
      <StoreContext.Provider value={[store, setStore]}>
        <div className='App'>
          <Header />
          <Rundown />
        </div>
      </StoreContext.Provider>
    </SharedContextProvider>
  )
}
