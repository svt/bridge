// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const transport = (function () {
  /*
  Use a dummy transport
  for unit-tests
  */
  if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
    return require('./dummy/transport')
  }
  if (module.parent) {
    console.log('[API] Using node transport')
    return require('./node/transport')
  }
  if (typeof window !== 'undefined') {
    console.log('[API] Using browser transport')
    return require('./browser/transport')
  }
})()

module.exports = transport
