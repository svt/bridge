// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const EventEmitter = require('events')

const WS = require('ws')
const uuid = require('uuid')

const Logger = require('./Logger')
const logger = new Logger({ name: 'SocketHandler' })

const wss = new WS.Server({ noServer: true })

class SocketHandler extends EventEmitter {
  constructor (state) {
    super()
    /**
     * @private
     *
     * A reference to all current
     * sockets ordered by their
     * session ids
     *
     * @type { Object.<String, WebSocket> }
     */
    this.sockets = {}

    /**
     * @private
     * Keep a reference to the state
     */
    this.state = state
  }

  /**
   * Upgrade a connection
   * to a websocket
   */
  upgrade (req, sock, head) {
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
              this.state.apply(json.data)
              break

              /*
             Update the heartbeat value for this socket,
             if we do this on the client delays may cause the
             socket's object to disappear which then will make
             us loose data
             */
            case 'heartbeat':
              this.state.apply({
                _connections: {
                  [id]: { heartbeat: Date.now() }
                }
              })
              break

            case 'disconnect':
              this.removeSocket(id)
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
              this.sockets[id] = ws

              this.state.apply({
                _connections: {
                  [id]: {
                    ...this.state.data[id],

                    /*
                    Make this the main connection
                    if it's the only one connected
                    */
                    ...(Object.values(this.state?.data?._connections || {}).length === 0 ? { role: 1 } : {})
                  }
                }
              })
              ws.send(JSON.stringify({ type: 'id', data: id }))
              break

            default:
              this.emit('message', id, ws, json)
          }
        } catch (err) {
          logger.error('Unable to parse socket body', err)
        }
      })

      /*
      Don't remove the socket on its 'close' event
      as we want to give it a chance to reconnect,
      instead it's removed from the state
      during the cleanup task
      */
    })
  }

  /**
   * Remove the references
   * to a socket by its id
   * @param { String } id The id of a socket to remove
   */
  removeSocket (id) {
    this.emit('remove', id)
    this.sockets[id]?.close()
    delete this.sockets[id]
  }

  /**
   * Get a socket by its id
   * @param { String } id
   * @returns { WebSocket }
   */
  getSocket (id) {
    return this.sockets[id]
  }

  /*
  Teardown the handler nicely
  and remove any handlers
  */
  teardown () {
    this.removeAllListeners('remove')
    this.removeAllListeners('message')
  }
}
module.exports = SocketHandler
