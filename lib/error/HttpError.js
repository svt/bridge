// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class HttpError extends Error {
  constructor (message, code, status) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.status = status
  }
}

module.exports = HttpError
