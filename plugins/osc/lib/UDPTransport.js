// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Transport = require('./Transport')

const dgram = require('node:dgram')

class UDPTransport extends Transport {
  /**
   * @private
   * @type { dgram.Socket }
   */
  #socket

  constructor () {
    super()
    this.#socket = dgram.createSocket('udp4')

    this.#socket.on('message', msg => {
      this.emit('message', msg)
    })
  }

  teardown () {
    super.teardown()
    this.#socket.close()
    this.#socket.removeAllListeners()
  }

  listen (port, address) {
    this.#socket.bind(port, address)
  }
}

module.exports = UDPTransport
