// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class ValidationError extends Error {
  constructor (message, code, params) {
    super(message)
    this.name = 'ValidationError'
    this.code = code
    this.params = params
  }
}

module.exports = ValidationError
