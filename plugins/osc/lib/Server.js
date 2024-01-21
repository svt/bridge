// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const EventEmitter = require('events')

const osc = require('osc-min')

class Server extends EventEmitter {
  /**
   * @private
   * @type { import('./Transport') }
   */
  _transport

  /**
   * @param { import('./Transport') } transport
   */
  constructor (transport) {
    super()

    this._transport = transport
    this._transport.on('message', msg => {
      const processed = this._process(msg)
      this.emit('message', processed)
    })
  }

  /**
   * @private
   * @param { Buffer } buffer
   */
  _process (buffer) {
    return osc.fromBuffer(buffer)
  }

  teardown () {
    this._transport.teardown()
    this.removeAllListeners()
  }
}

module.exports = Server
