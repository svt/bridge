// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const client = (function () {
  if (module.parent) {
    return require('./node/client')
  }
  if (typeof window !== 'undefined') {
    return require('./browser/client')
  }
})()

module.exports = client
