// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const WS = require('ws')

const EventEmitter = require('events')
const DIController = require('../../shared/DIController')

const random = require('../security/random')

const Logger = require('../Logger')
const logger = new Logger({ name: 'WorkspaceSockets' })

const wss = new WS.Server({ noServer: true })

const SOCKET_TTL_MS = 20000
const SOCKET_CLEANUP_INTERVAL_MS = 1000

class WorkspaceSockets extends EventEmitter {
  #sockets = {}
  #workspace

  #cleanupIval

  constructor () {
    super()
    this.#cleanupIval = setInterval(
      () => this.#deleteDeadSockets(),
      SOCKET_CLEANUP_INTERVAL_MS
    )
  }

  setWorkspace (newValue) {
    if (this.#workspace) {
      throw new Error('Workspace has already been set')
    }
    this.#workspace = newValue
  }

  #deleteDeadSockets () {
    const now = Date.now()

    for (const id of Object.keys(this.#sockets)) {
      const socket = this.#sockets[id]

      if (!socket.heartbeat) {
        this.#heartbeat(id)
      }

      if (now - socket.heartbeat > SOCKET_TTL_MS) {
        this.#deleteSocket(id)
      }
    }
  }

  #deleteSocket (id) {
    delete this.#sockets[id]
  }

  #storeNewSocket (ws) {
    const id = `ws:${random.string(12)}`
    if (this.#sockets[id]) {
      return this.#storeNewSocket()
    }

    const refresh = random.string(128)
    this.#sockets[id] = {
      refresh,
      ws
    }

    return {
      id,
      refresh
    }
  }

  #tryStoreExistingSocket (id, refresh, ws) {
    if (!id || !refresh) {
      return
    }

    const existingSocket = this.#sockets[id]
    if (!existingSocket) {
      return
    }

    if (existingSocket.refresh !== refresh) {
      logger.warn('Received invalid refresh token for id', id)
      return
    }

    this.#sockets[id] = {
      ...this.#sockets[id],
      ws
    }
    return true
  }

  #heartbeat (id) {
    if (!this.#sockets[id]) {
      logger.warn('Heartbeat for non existing socket', id)
      return
    }
    this.#sockets[id].heartbeat = Date.now()
  }

  async handleMessage (ctx, ws, msg) {
    if (!this.#workspace) {
      return
    }
    /*     const authorized = await this.#workspace.api.auth.authorizeCommand(msg.command, msg.args, msg?.headers?.authentication)
    if (!authorized) { */
    /**
       * @todo
       * Send error
       * to client
       */
    /*       logger.warn('Authorization failed', msg.command)
      return */
    /*     } */

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
      this.#workspace.api.commands.registerCommand(msg.args[0], (...args) => {
        /*
        Look up the actual socket rather than sending the response
        to the socket object provided as a parameter as
        it may have reconnected and become invalidated
        */
        this.getSocket(ctx.id)?.ws?.send(JSON.stringify({
          command: msg.args[0],
          args
        }))
      }, ctx.id)
      return
    }

    if (msg.command === 'events.triggerCommand') {
      this.#workspace.api.commands.executeCommand(msg.command, ...(msg.args || []), ctx.id)
      return
    }

    this.#workspace.api.commands.executeCommand(msg.command, ...(msg.args || []))
  }

  /**
   * Upgrade a connection
   * to a websocket
   */
  upgrade (req, sock, head) {
    wss.handleUpgrade(req, sock, head, ws => {
      const reqId = req.searchParams.get('id')
      const reqRefresh = req.searchParams.get('refresh')

      let id
      let refresh

      const didRefresh = this.#tryStoreExistingSocket(reqId, reqRefresh, ws)

      if (didRefresh) {
        id = reqId
        refresh = reqRefresh
      } else {
        const newIdentity = this.#storeNewSocket(ws)
        id = newIdentity.id
        refresh = newIdentity.refresh
      }

      ws.send(JSON.stringify({
        type: 'id',
        id,
        refresh
      }))

      ws.on('message', data => {
        try {
          const json = JSON.parse(data)

          switch (json.type) {
            case 'heartbeat':
              this.#heartbeat(id)
              break
            default:
              this.handleMessage({ id }, ws, json)
          }
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
    this.#workspace.api.commands.removeAllByOwner(id)
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
    return this.#sockets[id]
  }

  /*
  Teardown the handler nicely
  and remove any handlers
  */
  teardown () {
    clearInterval(this.#cleanupIval)
    this.removeAllListeners('remove')
    this.removeAllListeners('message')
  }
}

DIController.main.register('WorkspaceSockets', WorkspaceSockets)
