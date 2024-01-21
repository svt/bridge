// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Transport = require('./Transport')

const dgram = require('node:dgram')

/**
 * @typedef {{
 *  ipAddress: String,
 *  port: String
 * }} UDPTransportOptions
 */
class UDPTransport extends Transport {
  /**
   * @private
   * @type { UDPTransportOptions }
   */
  _opts

  /**
   * @private
   * @type { dgram.Socket }
   */
  _socket

  /**
   * @param { UDPTransportOptions } opts
   */
  constructor (opts = {}) {
    super()
    this._opts = opts
    this._socket = dgram.createSocket('udp4')

    this._socket.on('message', (msg, rinfo) => {
      this.emit('message', msg)
    })
  }

  teardown () {
    super.teardown()
    this._socket.close()
    this._socket.removeAllListeners()
  }

  listen (port, address) {
    this._socket.bind(port, address)
  }
}

module.exports = UDPTransport
