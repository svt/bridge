import React from 'react'

import { SharedContextProvider } from './sharedContext'

import { Header } from './components/Header'
import { Rundown } from './views/Rundown'

export default function App () {
  return (
    <SharedContextProvider>
      <div className='App'>
        <Header />
        <Rundown />
      </div>
    </SharedContextProvider>
  )
}
