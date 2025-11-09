// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('./ApiError')

class InvalidArgumentError extends ApiError {
  constructor (msg = 'Invalid argument') {
    super(msg)
  }
}
module.exports = InvalidArgumentError
