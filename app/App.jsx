import React from 'react'
import { Start } from './views/Start'
import { Workspace } from './views/Workspace'

import { LocalContext } from './localContext'
import { SharedContext } from './sharedContext'

import { useWebsocket } from './hooks/useWebsocket'

import { deepApply } from './utils/apply'

import {
  BrowserRouter as Router,
  Switch,
  Route
} from 'react-router-dom'

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
const socketHost = window.initialState.socketHost || `${socketProtocol}://${window.location.host}`

/**
 * The application id denoting which
 * instance of the app to connect to
 * @type { String }
 */
const applicationId = window.initialState.applicationId

export default function App () {
  const [local, setLocal] = React.useState({})
  const [shared, setShared] = React.useState({})
  const [data, send, readyState] = useWebsocket(`${socketHost}/api/v1/ws?applicationId=${applicationId}`, true)
  /**
    * Setup a reference to hold
    * the current value of the
    * states in order to access it from
    * within the apply functions
    * @type { React.Ref }
    */
  const sharedRef = React.useRef({})
  const localRef = React.useRef({})

  React.useEffect(() => {
    sharedRef.current = shared
  }, [shared])

  React.useEffect(() => {
    localRef.current = local
  }, [local])

  React.useEffect(() => {
    if (readyState !== 1) return
    send({ type: 'id', data: local.id })
  }, [readyState])

  /*
  Setup an interval to send a heartbeat
  at a regular interval to the server
  to indicate that the socket is alive
  */
  React.useEffect(() => {
    function sendHeartbeat () {
      if (!local.id) return
      send({ type: 'heartbeat' })
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
  function applyShared (data = {}) {
    /*
    Calculate the new shared state
    locally - be sure to copy the current
    state or React won't treat it as an update
    */
    const newShared = deepApply({ ...sharedRef.current }, data)
    setShared(newShared)

    send({ type: 'state', data })
  }

  /**
   * Apply data for a shallow
   * key in the shared context
   * @param { String } key The key to modify
   * @param { Object.<> } data Any data to apply
   */
  function applySharedKey (key, data = {}) {
    applyShared({
      [key]: data
    })
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
    const newLocal = deepApply({ ...localRef.current }, data)
    setLocal(newLocal)
  }

  /*
  Handle incoming data
  from the websocket
  based on the provided
  command type
  */
  React.useEffect(() => {
    if (!data) return
    const json = JSON.parse(data)
    switch (json?.type) {
      /*
      Update the local copy
      of the shared state,
      the server will send
      the complete state
      as an object
      */
      case 'state':
        setShared(json?.data)
        break
        /*
      Keep track of this connection's
      unique identifier and set the
      current path to the shared state
      */
      case 'id':
        applyLocal({ id: json?.data })
        applySharedKey(json?.data, { path: window.location.pathname })
        break
    }
  }, [data])

  /*
  Hijack pushState to update the shared
  state every time the user navigates
  to a new page if the local id is
  defined
  */
  React.useEffect(() => {
    const pushState = window.history.pushState
    window.history.pushState = (...args) => {
      pushState.apply(window.history, args)

      if (!local.id) return
      applySharedKey(local.id, {
        path: args[2]
      })
    }

    /*
    Reset the pushState-function
    before unloading
    */
    return () => { window.history.pushState = pushState }
  }, [])

  /*
  Listen for changes to the theme and
  update the body's class accordingly
  */
  React.useEffect(() => {
    if (!local.theme) return
    document.body.className = `u-theme--${local.theme}`
    window.localStorage.setItem('bridge.theme', local.theme)
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
    <LocalContext.Provider value={[local, applyLocal]}>
      <SharedContext.Provider value={[shared, applyShared, applySharedKey]}>
        <Router>
          <Switch>
            <Route path='/:workspace'>
              <Workspace />
            </Route>
            <Route path='/'>
              <Start />
            </Route>
          </Switch>
        </Router>
      </SharedContext.Provider>
    </LocalContext.Provider>
  )
}
