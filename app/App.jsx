import React from 'react'
import { Start } from './views/Start'
import { Workspace } from './views/Workspace'
import { WorkspaceWidget } from './views/WorkspaceWidget'

import { Router } from './components/Router'
import { Transparency } from './components/Transparency'
import { ContextMenuBoundary } from './components/ContextMenuBoundary'

import { LocalContext } from './localContext'
import { SharedContext } from './sharedContext'
import { SocketContext } from './socketContext'

import { useWebsocket } from './hooks/useWebsocket'


import * as shortcuts from './utils/shortcuts'
import * as browser from './utils/browser'
import * as auth from './auth'
import * as api from './api'

/**
  * The protocol (wss or ws)
  * that sockets should use
  * based on the current http
  * protocol
  * @type { string }
  */
const socketProtocol = (function () {
  if (window.location.protocol === 'https:') {
    return 'wss'
  }
  return 'ws'
})()

/**
  * The complete hostname,
  * including protocol
  * that the socket for
  * the shared state
  * should connect to
  * @type { String }
  */
const socketHost = window.APP.socketHost || `${socketProtocol}://${window.location.host}`

/**
 * The workspace id for
 * the current workspace
 * @type { String }
 */
const workspace = window.APP.workspace

/*
Register keydown and keyup event listeners
in order to parse shortcuts

this must be done both in the application scope [here]
and in any iframes
*/
;(function () {
  window.addEventListener('keydown', e => shortcuts.registerKeyDown(e))
  window.addEventListener('keyup', e => shortcuts.registerKeyUp(e))
})()

/*
Add a data attribute with the platform to the
root html tag for platform-specific styling e.t.c.
*/
;(function () {
  window.document.documentElement.dataset.platform = browser.platform()
  window.document.documentElement.dataset.agent = browser.isElectron() ? 'electron' : 'web'
})()

const websocketQuery = {
  workspace
}

export default function App () {
  const [local, setLocal] = React.useState({})
  const [shared, setShared] = React.useState({})

  const [data, send, readyState] = useWebsocket(workspace && `${socketHost}/api/v1/ws`, true, websocketQuery)

  /**
    * Setup a reference to hold
    * the current value of the
    * state in order to access it from
    * within the apply functions
    * @type { React.Ref }
    */
  const localRef = React.useRef({})

  React.useEffect(() => {
    localRef.current = local
  }, [local])

  React.useEffect(() => {
    /**
     * Setup the Bridge api
     * and attach listeners
     */
    async function setup () {
      const bridge = await api.load()

      bridge.transport.send = msg => {
        send(msg)
      }

      if (!bridge.client.getIdentity()) {
        const id = await bridge.client.registerClient()
        applyLocal({ id })
      }
      
      bridge.transport.replayQueue()

      bridge.events.on('state.change', state => {
        setShared({ ...state })
      })

      window.onbeforeunload = () => {
        bridge.client.removeClient()
      }

      const initialState = await bridge.state.get()
      setShared(initialState)
    }
    if (readyState !== 1) return
    setup()
  }, [readyState])

  React.useEffect(() => {
    async function setup () {
      const token = await auth.getToken()
      const bridge = await api.load()
      bridge.commands.setHeader('authentication', token)
    }
    if (readyState !== 1) return
    setup()
  }, [readyState])

  /**
   * Apply data to the shared state,
   * this will send a partial update
   * as well as updating the local copy
   * to match
   * @param { Object.<> } data An object containing data to apply
   */
  async function applyShared (data = {}) {
    const bridge = await api.load()
    bridge.state.apply(data)
  }

  /**
   * A convenience function for setting
   * data to the local context without
   * replacing the whole object
   * @param { Object.<> } data An object containing data to apply
   */
  function applyLocal (data = {}) {
    /*
    Calculate the new local state and
    be sure to copy the current state
    or React won't treat it as an update
    */
    const newLocal = window?.shared?.merge?.deep({ ...localRef.current }, data)
    setLocal(newLocal)
  }

  /*
  Handle incoming data
  from the websocket
  based on the provided
  command type
  */
  React.useEffect(() => {
    ;(async function () {
      if (!data) {
        return
      }
      const bridge = await api.load()
      bridge.transport.receive(data)
    })()
  }, [data])

  /*
  Listen for changes to the theme and
  update the body's class accordingly
  */
  React.useEffect(() => {
    if (!local.theme) return
    document.body.className = `u-theme--${local.theme}`
    window.localStorage.setItem('bridge.theme', local.theme)
    applyLocal({ appliedTheme: local.theme })
  }, [local.theme])

  /*
  Load the theme from localstorage
  into the local context
  */
  React.useEffect(() => {
    const theme = window.localStorage.getItem('bridge.theme') || 'dark'
    applyLocal({ theme })
  }, [])

  /*
  Listen to changes to localstorage to update
  the current window if the theme changes in another window

  Note that the event won't fire in the same
  window that set the local storage item
  */
  React.useEffect(() => {
    function onStorageChange (e) {
      if (e.key === 'bridge.theme') {
        applyLocal({
          theme: e.newValue
        })
      }
    }
    window.addEventListener('storage', onStorageChange)
    return () => {
      window.removeEventListener('storage', onStorageChange)
    }
  }, [])

  return (
    <SocketContext.Provider value={[send, data]}>
      <LocalContext.Provider value={[local, applyLocal]}>
        <SharedContext.Provider value={[shared, applyShared]}>
          <ContextMenuBoundary>
            <Transparency />
            <Router routes={[
              {
                path: /^\/workspaces\/.+\/widgets\/.+$/,
                render: () => <WorkspaceWidget />
              },
              {
                path: /^\/workspaces\/.+$/,
                render: () => <Workspace />
              },
              {
                path: '/',
                render: () => <Start />
              }
            ]}/>
          </ContextMenuBoundary>
        </SharedContext.Provider>
      </LocalContext.Provider>
    </SocketContext.Provider>
  )
}
