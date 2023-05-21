// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('./ApiError')

class MissingArgumentError extends ApiError {
  constructor (msg = 'Missing argument') {
    super(msg)
  }
}
module.exports = MissingArgumentError
