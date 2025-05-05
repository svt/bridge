import React from 'react'

import * as router from './router.js'

/**
 * @type { import('./router.js').Route[] }
 */
const DEFAULT_ROUTES = [
  {
    path: '/',
    render: () => <span>Hello World</span>
  }
]

export function Router ({ routes = DEFAULT_ROUTES }) {
  const [path, setPath] = React.useState(window.location.pathname)

  /*
   * Add a handler to the navigate-event and
   * update the path state whenever it changes
   */
  React.useEffect(() => {
    /*
     * Feature check as window.navigation may
     * not yet be supported in all browsers
     */
    if (!window?.navigation || typeof window?.navigation === 'undefined') {
      return
    }

    function onNavigationChange (e) {
      setPath(window.location.pathname)
    }

    window.navigation.addEventListener('navigate', onNavigationChange)
    return () => {
      window.navigation.removeEventListener('navigate', onNavigationChange)
    }
  }, [])

  if (!path || !Array.isArray(routes)) {
    return <></>
  }

  const route = router.findRoute(path, routes)
  return route?.render() || <></>
}