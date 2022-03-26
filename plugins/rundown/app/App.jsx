import React from 'react'

import { SharedContextProvider } from './sharedContext'

import { Header } from './components/Header'
import { RundownList } from './components/RundownList'

export default function App () {
  return (
    <SharedContextProvider>
      <Header />
      <RundownList />
    </SharedContextProvider>
  )
}
