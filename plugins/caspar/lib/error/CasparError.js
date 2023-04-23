// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class CasparError extends Error {
  constructor (msg, code) {
    super(msg)
    this.name = 'CasparError'
    this.code = code
  }
}
module.exports = CasparError
