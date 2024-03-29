// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class ApiError extends Error {
  constructor (msg = 'Api error') {
    super(msg)
  }
}
module.exports = ApiError
