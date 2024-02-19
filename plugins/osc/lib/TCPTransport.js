// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Transport = require('./Transport')

const net = require('node:net')

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
    })
  }

  teardown () {
    super.teardown()
    this.#server.close()
  }

  listen (port, address) {
    this.#server.listen(port, address)
  }
}

module.exports = TCPTransport
