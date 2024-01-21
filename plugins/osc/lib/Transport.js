// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const EventEmitter = require('events')

/**
 * A base class for transports
 * for the Server class
 */
class Transport extends EventEmitter {
  /**
   * Tear down this transport
   */
  teardown () {
    this.removeAllListeners()
  }
}

module.exports = Transport
