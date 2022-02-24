// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const handlers = []

let sendQueue = []

/**
 * Replay the send queue and
 * sequentially call send for
 * every message
 */
function replayQueue () {
  const tmpQueue = sendQueue
  sendQueue = []

  for (const message of tmpQueue) {
    this.send(message)
  }
}

/**
 * Send a message with the
 * transport, for messages
 * leaving the api
 *
 * Unless overridden
 * messages will be queued
 *
 * @param { Object } message
 */
function send (message) {
  sendQueue.push(message)
}

/**
 * Add a handler to be called when
 * this transport receives a message
 * @param { (Any) -> Void } handler
 */
function onMessage (handler) {
  handlers.push(handler)
}

/**
 * The entrypoint for messages
 * coming into the api
 *
 * This should be called by the application
 * when a new message is to be handled
 *
 * @param { Object } message
 */
function receive (message) {
  handlers.forEach(handler => handler(message))
}

/**
  * @type { import('../transport').Communicator }
  */
module.exports = {
  send,
  receive,
  replayQueue,
  onMessage
}
