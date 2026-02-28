// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const environment = require('./shared/environment')

;(function () {
  /*
  Use a dummy transport
  for unit-tests
  */
  if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
    require('./dummy/transport')
    return
  }
  if (environment.isNode()) {
    console.log('[API] Using node transport')
    require('./node/transport')
    return
  }
  if (environment.isBrowser()) {
    console.log('[API] Using browser transport')
    require('./browser/transport')
  }
})()
