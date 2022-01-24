/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef {{
 *  type: String,
 *  data: Object?,
 *  args: Object?
 * }} Message
 */

const EventEmitter = require('events')

const WS = require('ws')
const uuid = require('uuid')
const Logger = require('./Logger')

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
            Handle an rpc-like
            function call
            */
            case 'call':

              break

            case 'emit':
              /*
                1. Call the emit function on the command
                   bus with the args as the args array
              */
              break

            case 'on':
              /*
                1. Call the on function on the command bus so that the event is emitted directly to the
                   socket - such as:
                   bus.on(event, data => ws.send(JSON.stringify({ type: 'on', args: [event, ...data]})))
              */
              break

            /*
             Update the shared state with
             the received partial data
             and broadcast it to the
             connected sessions
             */
            case 'state':
              if (json.data == null) return
              this.state.apply(json.data, { ignoreNotify: [id] })
              break

              /*
             Update the heartbeat value for this socket,
             if we do this on the client delays may cause the
             socket's object to disappear which then will make
             us loose data
             */
            case 'heartbeat':
              this.state.apply({
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
              this.sockets[id] = ws

              this.state.apply({
                connections: {
                  $replace: Object.keys(this.sockets)
                },
                [id]: {
                  ...this.state.data[id]
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

  /**
   * Broadcast a message to
   * all connected sockets
   * @param { Message } message A message to serialize and send
   * @param { String[] } ignore An array of ids of sockets to ignore
   */
  broadcast (message, ignore = []) {
    const str = JSON.stringify(message)
    Object.entries(this.sockets).forEach(([id, ws]) => {
      if (ignore.includes(id)) return
      ws.send(str)
    })
  }

  remove (id) {
    this.emit('remove', id)
    this.sockets[id]?.close()
    delete this.sockets[id]
  }
}
module.exports = SocketHandler