// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Transport = require('./Transport')

const net = require('node:net')

const DEFAULT_SOCKET_TIMEOUT_MS = 10000

class TCPTransport extends Transport {
  /**
   * @private
   * @type { net.Server }
   */
  #server

  constructor () {
    super()
    this.#server = net.createServer(socket => {
      socket.on('data', data => {
        this.emit('message', data)
      })
      socket.on('close', () => {
        socket.removeAllListeners()
      })
      socket.on('timeout', () => {
        socket.end()
      })
      socket.setTimeout(DEFAULT_SOCKET_TIMEOUT_MS)
    })

    this.#server.on('error', err => {
      this.emit('error', err)
    })
  }

  teardown () {
    super.teardown()
    this.#server.close()
    this.#server.removeAllListeners()
  }

  listen (port, address) {
    this.#server.listen(port, address)
  }
}

module.exports = TCPTransport
