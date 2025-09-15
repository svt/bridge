import React from 'react'
import { SharedContext } from '../../sharedContext'

function getEnvironment () {
  if (window.navigator.userAgent.includes('Bridge')) {
    return 'electron'
  }
  return 'web'
}

export function Transparency () {
  const [shared] = React.useContext(SharedContext)

  React.useEffect(() => {
    const value = shared?._userDefaults?.appearance?.transparency
    const env = getEnvironment()

    if (value && env === 'electron') {
      document.body.classList.add('is-transparent')
    } else {
      document.body.classList.remove('is-transparent')
    }
  }, [shared?._userDefaults?.appearance?.transparency])

  return <></>
}
