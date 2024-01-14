// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class CommandError extends Error {
  constructor (msg, code) {
    super(msg)
    this.name = 'CommandError'
    this.code = code
  }
}
module.exports = CommandError
