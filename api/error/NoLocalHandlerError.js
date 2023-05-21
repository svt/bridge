// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('./ApiError')

class NoLocalHandlerError extends ApiError {
  constructor (msg = 'Missing local handler') {
    super(msg)
  }
}
module.exports = NoLocalHandlerError
