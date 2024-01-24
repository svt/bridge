import React from 'react'

import { InspectorReferenceButton } from './views/InspectorReferenceButton'

export default function App () {
  const [view, setView] = React.useState()

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setView(params.get('path'))
  }, [])

  switch (view) {
    case 'inspector/reference/button':
      return <InspectorReferenceButton />
    default:
      return <></>
  }
}
