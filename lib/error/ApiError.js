// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class ApiError extends Error {
  constructor (message, code) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

module.exports = ApiError
