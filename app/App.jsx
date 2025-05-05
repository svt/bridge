import React from 'react'
import { Start } from './views/Start'
import { Workspace } from './views/Workspace'

import { Router } from './components/Router'

import { LocalContext } from './localContext'
import { SharedContext } from './sharedContext'
import { SocketContext } from './socketContext'

import { useWebsocket } from './hooks/useWebsocket'

import * as shortcuts from './utils/shortcuts'
import * as browser from './utils/browser'
import * as api from './api'

/**
 * Define the interval of heartbeats
 * sent to the server to indicate that
 * the socket is alive
 *
 * This value MUST be smaller than the
 * ttl of a socket defined in the server
 *
 * Defaults to 5 seconds
 *
 * @type { Number }
 */
const HEARTBEAT_INTERVAL_MS = 5000

/**
  * The protocol (wss or ws)
  * that sockets should use
  * based on the current http
  * protocol
  * @type { String }
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
})()

export default function App () {
  const [local, setLocal] = React.useState({})
  const [shared, setShared] = React.useState({})

  const [data, send, readyState] = useWebsocket(`${socketHost}/api/v1/ws?workspace=${workspace}`, true)

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
    if (readyState !== 1) return
    send({ type: 'id', data: local.id })
  }, [readyState])

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
      bridge.transport.replayQueue()

      bridge.events.on('state.change', state => {
        setShared({ ...state })
      })

      window.onbeforeunload = () => {
        send({ type: 'disconnect' })
      }

      const initialState = await bridge.state.get()
      setShared(initialState)
    }
    if (readyState !== 1) return
    setup()
  }, [readyState])

  /*
  Setup an interval to send a heartbeat
  at a regular interval to the server
  to indicate that the socket is alive
  */
  React.useEffect(() => {
    async function sendHeartbeat () {
      const bridge = await api.load()
      bridge.client.heartbeat()
    }

    const ival = setInterval(
      () => sendHeartbeat(),
      HEARTBEAT_INTERVAL_MS
    )
    sendHeartbeat()

    return () => clearInterval(ival)
  }, [local])

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
      if (!data) return
      const json = JSON.parse(data)
      switch (json?.type) {
        /*
        Keep track of this connection's
        unique identifier and setup the
        client's initial state
        */
        case 'id':
          applyLocal({ id: json?.data })
          applyShared({
            _connections: {
              [json?.data]: {
                isPersistent: browser.isElectron()
              }
            }
          })
          ;(await api.load()).client.setIdentity(json?.data)
          break

        /*
        Forward the message to
        the api for processing
        */
        default:
          ;(async function () {
            const bridge = await api.load()
            bridge.transport.receive(json)
          })()
          break
      }
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

  return (
    <SocketContext.Provider value={[send, data]}>
      <LocalContext.Provider value={[local, applyLocal]}>
        <SharedContext.Provider value={[shared, applyShared]}>
          <Router routes={[
            {
              path: /^\/workspaces\/.+$/,
              render: () => <Workspace />
            },
            {
              path: '/',
              render: () => <Start />
            }
          ]}/>
        </SharedContext.Provider>
      </LocalContext.Provider>
    </SocketContext.Provider>
  )
}
