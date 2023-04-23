// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class TcpSocketError extends Error {
  constructor (msg, code) {
    super(msg)
    this.code = code
    this.name = 'TcpSocketError'
  }
}
module.exports = TcpSocketError
