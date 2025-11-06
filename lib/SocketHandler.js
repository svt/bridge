// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const EventEmitter = require('events')

const WS = require('ws')

const Logger = require('./Logger')
const logger = new Logger({ name: 'SocketHandler' })

const wss = new WS.Server({ noServer: true })

class SocketHandler extends EventEmitter {
  constructor (workspace, state) {
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

    this.workspace = workspace

    this.workspace.api.events.on('connections.remove', id => {
      this.removeSocket(id)
    })

    /**
     * @private
     * Keep a reference to the state
     */
    this.state = state
  }

  async handleMessage (ctx, ws, msg) {
    if (msg.command === 'connections.registerConnection' && msg.args[1]) {
      /**
       * @todo
       * Check token to see if it's
       * authorized for a connection id
       */
      ctx.id = msg.args[1]

      /**
       * @todo
       * Should we also close any previous
       * socket associated with the id here
       * before associating a new socket with it?
       */
      if (this.sockets[ctx.id]) {
        this.sockets[ctx.id].close()
      }
      this.sockets[ctx.id] = ws
      this.workspace.api.commands.executeCommand(msg.args[0], ctx.id)
      return
    }

    if (msg.command === 'connections.registerConnection' && !msg.args[1]) {
      const id = this.workspace.api.connections.registerConnection(this.workspace.api.connections.type.render)
      ctx.id = id
      this.sockets[id] = ws
      this.workspace.api.commands.executeCommand(msg.args[0], id)
      return
    }

    if (msg.command === 'connections.removeConnection') {
      this.removeSocket(ctx.id)
      this.workspace.api.connections.removeConnection(ctx.id)
      this.workspace.api.commands.executeCommand(msg.args[0])
      return
    }

    if (msg.command === 'commands.registerCommand') {
      /**
       * msg.args will be an array of arguments
       * where the first argument is the identifier
       * of the command to call.
       *
       * See the implementation of
       * the original registerCommand
       * function
       *
       * @see /lib/api/index.js
       */
      this.workspace.api.commands.registerCommand(msg.args[0], (...args) => {
        /*
        Look up the actual socket rather than sending the response
        to the socket object provided as a parameter as
        it may have reconnected and become invalidated
        */
        this.getSocket(ctx.id)?.send(JSON.stringify({
          command: msg.args[0],
          args
        }))
      }, ctx.id)
      return
    }

    /**
     * The security context which will be used
     * for authorization when running commands
     *
     * @type { import('./api/SCommands').SCommandsSecurityContext }
     */
    const securityCtx = {
      type: 'client',
      client: {
        id: ctx.id
      }
    }

    this.workspace.api.commands.authorizeAndExecuteCommand(securityCtx, msg.command, ...(msg.args || []))
  }

  /**
   * Upgrade a connection
   * to a websocket
   */
  upgrade (req, sock, head) {
    wss.handleUpgrade(req, sock, head, ws => {
      /**
        * Hold a reference to the connection's context,
        * including its id
        * @type {{
        *   id: string | undefined
        * }}
        */
      const ctx = {}

      ws.on('message', data => {
        try {
          const json = JSON.parse(data)
          this.handleMessage(ctx, ws, json)
        } catch (err) {
          logger.error('Unable to parse socket body', err)
        }
      })
    })
  }

  /**
   * Remove the references
   * to a socket by its id
   * @param { String } id The id of a socket to remove
   */
  removeSocket (id) {
    if (!this.sockets[id]) {
      return
    }
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
