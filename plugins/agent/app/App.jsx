import React from 'react'
import './style.css'

import { Chat } from './views/Chat'
import { Settings } from './views/Settings'

export default function () {
  const [view, setView] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('path'))
  }, [])

  switch (view) {
    case 'chat':
      return <Chat />
    case 'settings':
      return <Settings />
    default:
      return <></>
  }
}