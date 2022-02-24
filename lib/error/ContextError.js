// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class ContextError extends Error {
  constructor (message, code, status) {
    super(message)
    this.name = 'ContextError'
    this.code = code
    this.status = status
  }
}

module.exports = ContextError
