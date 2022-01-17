/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const WS = require('ws')
const uuid = require('uuid')
const Logger = require('./Logger')
const State = require('./State')

const wss = new WS.Server({ noServer: true })

const SOCKET_KEEPALIVE_TIMEOUT_MS = 20000

/**
  * A reference to all current
  * sockets ordered by their
  * session ids
  *
  * @type { Object.<String, WebSocket> }
  */
const sockets = {}

;(function () {
  /*
  Set initial values
  for the state
  */
  State.getInstance().data.connections = []

  /*
  Listen for changes to the state
  and send it to sockets accordingly
  */
  State.getInstance().on('change', (state, opts) => {
    const str = JSON.stringify({ type: 'state', data: state })
    Object.entries(sockets).forEach(([id, ws]) => {
      if (opts?.ignoreNotify?.includes(id)) return
      ws.send(str)
    })
  })
})()

;(function () {
  function cleanSockets () {
    const now = Date.now()

    const state = State.getInstance().data
    Object.keys(state)
      .filter(key => uuid.validate(key))
      .forEach(id => {
        /*
         Set the heartbeat of any
         connections missing it in
         order to clean up the state
         */
        if (State.getInstance().data[id].heartbeat == null) {
          State.getInstance().apply({ [id]: { heartbeat: now } })
          return
        }

        /*
         Remove any connections with
         an expired heartbeat
         */
        if (now - state[id]?.heartbeat < SOCKET_KEEPALIVE_TIMEOUT_MS) {
          return
        }
        removeSocket(id)
      })
  }

  /*
   Go through each connection and remove those
   with expired heartbeats every second
   */
  setInterval(() => cleanSockets(), 1000)
}())

function removeSocket (id) {
  const state = State.getInstance().data

  const index = state.connections.indexOf(id)
  if (index >= 0) {
    state.connections.splice(index, 1)
  }

  delete state[id]

  sockets[id]?.close()
  delete sockets[id]
}

function handleUpgrade (req, sock, head) {
  wss.handleUpgrade(req, sock, head, ws => {
    /**
      * Hold a reference to the connection's id,
      * it will be defined when the client sends
      * a message of type 'id'
      * @type { String }
      */
    let id

    ws.on('message', data => {
      try {
        const json = JSON.parse(data)
        switch (json.type) {
          /*
           Update the shared state with
           the received partial data
           and broadcast it to the
           connected sessions
           */
          case 'state':
            if (json.data == null) return
            State.getInstance().apply(json.data, { ignoreNotify: [id] })
            break

            /*
           Update the heartbeat value for this socket,
           if we do this on the client delays may cause the
           socket's object to disappear which then will make
           us loose data
           */
          case 'heartbeat':
            State.getInstance().apply({
              [id]: { heartbeat: Date.now() }
            })
            break

            /*
           Assign a unique identifier
           to the connection, or use
           one that's provided by the client
           */
          case 'id':
            if (json.data != null) {
              id = String(json.data)
            } else {
              id = uuid.v4()
            }
            sockets[id] = ws

            State.getInstance().apply({
              connections: {
                $replace: Object.keys(sockets)
              },
              [id]: {
                ...State.getInstance().data[id]
              }
            })
            ws.send(JSON.stringify({ type: 'id', data: id }))
            break
        }
      } catch (err) {
        Logger.error('Unable to parse socket body', err)
      }
    })

    ws.on('error', e => {
      Logger.error(e)
    })
  })
}
exports.handleUpgrade = handleUpgrade
