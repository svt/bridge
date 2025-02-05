// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')

class Transport {
  #handlers = []
  #queue = []

  /**
   * Replay the send queue and
   * sequentially call send for
   * every message
   */
  replayQueue () {
    const tmpQueue = this.#queue
    this.#queue = []

    for (const message of tmpQueue) {
      this.send(message)
    }
  }

  /**
   * The entrypoint for messages
   * coming into the api
   *
   * This should be called by the application
   * when a new message is to be handled
   *
   * @param { Object } msg
   */
  receive (msg) {
    this.#handlers.forEach(handler => handler(msg))
  }

  onMessage (handler) {
    this.#handlers.push(handler)
  }

  /**
   * Send a message with the
   * transport, for messages
   * leaving the api
   *
   * Unless overridden
   * messages will be queued
   *
   * @param { Object } msg
   */
  send (msg) {
    this.#queue.push(msg)
  }
}

DIController.main.register('Transport', Transport)
