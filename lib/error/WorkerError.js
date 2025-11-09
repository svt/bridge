// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

class WorkerError extends Error {
  constructor (msg) {
    super(msg)
    this.name = 'WorkerError'
    this.code = 'ERR_WORKER'
  }
}

module.exports = WorkerError
