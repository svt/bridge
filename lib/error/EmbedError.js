// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

class EmbedError extends Error {
  constructor (message, code, status) {
    super(message)
    this.name = 'EmbedError'
    this.code = code
    this.status = status
  }
}

module.exports = EmbedError
