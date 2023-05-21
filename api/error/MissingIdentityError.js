// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('./ApiError')

class MissingIdentityError extends ApiError {
  constructor (msg = 'Unknown client identity') {
    super(msg)
  }
}
module.exports = MissingIdentityError
