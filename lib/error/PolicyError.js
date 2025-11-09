// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

class PolicyError extends Error {
  constructor (message, reason) {
    super(message)
    this.name = 'PolicyError'
    this.reason = reason
  }
}

module.exports = PolicyError
