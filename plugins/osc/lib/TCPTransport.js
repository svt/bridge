// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Transport = require('./Transport')

const net = require('node:net')

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'OSC: TCPTransport' })

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
      socket.on('error', err => {
        logger.debug('Connection error', err)
      })
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
