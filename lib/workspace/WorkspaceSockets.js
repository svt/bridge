// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

const messageEncoder = require('../../shared/messageEncoder')

const random = require('../security/random')

const Logger = require('../Logger')
const logger = new Logger({ name: 'WorkspaceSockets' })

const SOCKET_GRACE_PERIOD_MS = 10000

/*
Per-workspace WebSocket bookkeeping. The HTTP layer (Bun.serve in
lib/server.js) owns the actual ServerWebSocket instances and dispatches
open/message/close into the matching workspace's `attach` / `receive` /
`detach` methods using the workspace id stashed in `ws.data`.
*/
class WorkspaceSockets {
  #sockets = {}
  #workspace

  setWorkspace (newValue) {
    if (this.#workspace) {
      throw new Error('Workspace has already been set')
    }
    this.#workspace = newValue
  }

  #storeNewSocket (ws) {
    const id = `ws:${random.string(12)}`
    if (this.#sockets[id]) {
      return this.#storeNewSocket(ws)
    }

    const refresh = random.string(128)
    this.#sockets[id] = { refresh, ws }
    return { id, refresh }
  }

  #tryStoreExistingSocket (id, refresh, ws) {
    if (!id || !refresh) return

    const existingSocket = this.#sockets[id]
    if (!existingSocket) {
      logger.warn('Tried to reconnect a socket that doesn\'t exist', id)
      return
    }
    if (existingSocket.refresh !== refresh) {
      logger.warn('Received invalid refresh token for id', id)
      return
    }

    this.#sockets[id] = { ...this.#sockets[id], ws }
    return true
  }

  /**
   * Register a freshly-upgraded WebSocket. Sends the welcome
   * `{ type: 'id', id, refresh }` frame so the client can reconnect
   * within the grace period using the same identity.
   *
   * The owning Bun.ServerWebSocket is stored on ws.data.socketId so
   * `receive`/`detach` can find this entry without scanning.
   */
  attach (ws, reqId, reqRefresh) {
    let id
    let refresh

    if (this.#tryStoreExistingSocket(reqId, reqRefresh, ws)) {
      id = reqId
      refresh = reqRefresh
      if (this.#sockets[id].timeout) {
        clearTimeout(this.#sockets[id].timeout)
        this.#sockets[id].timeout = undefined
      }
    } else {
      const fresh = this.#storeNewSocket(ws)
      id = fresh.id
      refresh = fresh.refresh
    }

    ws.data.socketId = id
    ws.send(JSON.stringify({ type: 'id', id, refresh }))
  }

  /**
   * Handle a decoded message from a registered socket.
   */
  async receive (ws, msg) {
    if (!this.#workspace) return
    if (!msg.command) return

    const ctx = { id: ws.data.socketId }

    try {
      const authorized = await this.#workspace.api.auth.authorizeCommand(
        msg.command, msg.args, msg?.headers?.authentication
      )
      if (!authorized) {
        logger.warn('Unauthorized', msg.command)
        return
      }
    } catch (err) {
      logger.warn('Unauthorized', msg.command, err.message)
      this.#sendToId(ctx.id, {
        error: { message: err.message, code: err.code }
      })
      return
    }

    if (msg.command === 'commands.registerCommand') {
      this.#workspace.api.commands.registerCommand(msg.args[0], (...args) => {
        this.#sendToId(ctx.id, { command: msg.args[0], args })
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
   * Mark a socket as disconnected and start the grace-period timer
   * after which its commands are torn down. Called by server.js on
   * `websocket.close`.
   */
  detach (ws) {
    const id = ws.data.socketId
    if (!id) {
      logger.warn('Socket closed without an id, this shouldn\'t happen')
      return
    }
    const entry = this.#sockets[id]
    if (!entry) return

    entry.timeout = setTimeout(() => {
      this.removeSocket(id)
    }, SOCKET_GRACE_PERIOD_MS)
  }

  #sendToId (id, jsonMessage) {
    const encoded = messageEncoder.encodeMessage(jsonMessage)
    this.getSocket(id)?.ws?.send(JSON.stringify(encoded))
  }

  removeSocket (id) {
    this.#workspace.api.commands.removeAllByOwner(id)
    const entry = this.#sockets[id]
    if (!entry) return
    try { entry.ws?.close() } catch { /* already closed */ }
    delete this.#sockets[id]
  }

  getSocket (id) {
    return this.#sockets[id]
  }

  teardown () {
    for (const id of Object.keys(this.#sockets)) {
      const entry = this.#sockets[id]
      try { entry.ws?.close() } catch { /* */ }
      if (entry.timeout) clearTimeout(entry.timeout)
    }
  }
}

DIController.main.register('WorkspaceSockets', WorkspaceSockets)
