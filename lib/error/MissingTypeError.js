// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class MissingTypeError extends Error {
  constructor () {
    super('No such type exists')
    this.name = 'MissingTypeError'
    this.code = 'ERR_TYPE_MISSING_TYPE'
  }
}

module.exports = MissingTypeError
