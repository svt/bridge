// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const { parentPort } = require('worker_threads')

const DIController = require('../../shared/DIController')

class Transport {
  onMessage (handler) {
    parentPort.on('message', handler)
  }

  send (msg) {
    parentPort.postMessage(msg)
  }
}

DIController.main.register('Transport', Transport)
