// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { parentPort } = require('worker_threads')

/**
 * @type { import('../transport').Communicator }
 */
module.exports = {
  onMessage: handler => parentPort.on('message', handler),
  send: msg => parentPort.postMessage(msg)
}
