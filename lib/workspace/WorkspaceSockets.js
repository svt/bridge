// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const WS = require('ws')

const DIController = require('../../shared/DIController')

const messageEncoder = require('../../shared/messageEncoder')

const random = require('../security/random')

const Logger = require('../Logger')
const logger = new Logger({ name: 'WorkspaceSockets' })

const wss = new WS.Server({ noServer: true })

const SOCKET_GRACE_PERIOD_MS = 10000

class WorkspaceSockets {
  #sockets = {}
  #workspace

  /**
   * Set a reference to the workspace
   * to be used to access the api
   *
   * This will be set by the
   * Workspace's setup function and
   * should only be called once
   *
   * @param { Workspace } newValue
   */
  setWorkspace (newValue) {
    if (this.#workspace) {
      throw new Error('Workspace has already been set')
    }
    this.#workspace = newValue
  }

  /**
   * Store a newly connected socket
   * for later reference,
   *
   * this will generate an
   * id and refresh token
   * so that the client can
   * reconnect with the same id
   *
   * @param { WS } ws
   * @returns {{
   *  id: string,
   *  refresh: string
   * }}
   */
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

  /**
   * Try to reconnect a socket to
   * an already existing id rather
   * than treating it as a new one
   *
   * @param { string } id
   * @param { string } refresh
   * @param { WS } ws
   * @returns { boolean } true if the reconnect was successful
   */
  #tryStoreExistingSocket (id, refresh, ws) {
    if (!id || !refresh) {
      return
    }

    const existingSocket = this.#sockets[id]
    if (!existingSocket) {
      logger.warn('Tried to reconnect a socket that doesn\'t exist', id)
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

  async handleMessage (ctx, ws, msg) {
    if (!this.#workspace) {
      return
    }

    if (!msg.command) {
      return
    }

    /*
    Authorize the command
    before executing
    */
    try {
      const authorized = await this.#workspace.api.auth.authorizeCommand(msg.command, msg.args, msg?.headers?.authentication)
      if (!authorized) {
        logger.warn('Unauthorized', msg.command)
        return
      }
    } catch (err) {
      logger.warn('Unauthorized', msg.command, err.message)
      this.#sendToId(ctx.id, {
        error: {
          message: err.message,
          code: err.code
        }
      })
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
      this.#workspace.api.commands.registerCommand(msg.args[0], (...args) => {
        /*
        Look up the actual socket rather than sending the response
        to the socket object provided as a parameter as
        it may have reconnected and become invalidated
        */
        this.#sendToId(ctx.id, {
          command: msg.args[0],
          args
        })
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
   * Send a message to a
   * socket by its id
   *
   * Use this when responding from the api
   * rather than keeping a reference as id's
   * will allways point to the active socket object,
   * as sockets may reconnect
   *
   * Messages will be encoded
   * before they are sent as
   * to cut unnecessary bytes
   *
   * @param { string } id
   * @param { any } jsonMessage
   */
  #sendToId (id, jsonMessage) {
    const encoded = messageEncoder.encodeMessage(jsonMessage)
    this.getSocket(id)?.ws?.send(JSON.stringify(encoded))
  }

  /**
   * Upgrade a connection
   * to a websocket and add listeners
   * and manage state
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

        /*
        Cancel the timer that would remove
        this socket if it wasn't reconnected
        */
        if (this.#sockets[id].timeout) {
          clearTimeout(this.#sockets[id].timeout)
          this.#sockets[id].timeout = undefined
        }
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
          const decoded = messageEncoder.decodeMessage(json)
          this.handleMessage({ id }, ws, decoded)
        } catch (err) {
          logger.error('Unable to parse socket body', err)
        }
      })

      ws.on('close', () => {
        if (!id) {
          logger.warn('Socket closed without an id, this shouldn\'t happen')
          return
        }
        /*
        Create a timeout that will remove the
        socket object after a grace period as
        we want to give the client a chance
        to reconnect to the same id

        The timeout will be cancelled on reconnect
        */
        this.#sockets[id].timeout = setTimeout(() => {
          this.removeSocket(id)
        }, SOCKET_GRACE_PERIOD_MS)
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
    if (!this.#sockets[id]) {
      return
    }
    this.#sockets[id]?.ws?.close()
    delete this.#sockets[id]
  }

  /**
   * Get a socket by its id
   * @param { String } id
   * @returns {{
   *  ws: WebSocket,
   *  reconnect: string
   * }}
   */
  getSocket (id) {
    return this.#sockets[id]
  }

  /*
  Teardown the handler nicely
  and remove any handlers
  */
  teardown () {
    for (const id of Object.keys(this.#sockets)) {
      const socket = this.#sockets[id]

      if (socket.ws) {
        socket.ws.close()
      }

      if (socket.timeout) {
        clearTimeout(socket.timeout)
      }
    }
  }
}

DIController.main.register('WorkspaceSockets', WorkspaceSockets)
