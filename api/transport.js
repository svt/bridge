// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

;(function () {
  /*
  Use a dummy transport
  for unit-tests
  */
  if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) {
    require('./dummy/transport')
    return
  }
  if (module.parent) {
    console.log('[API] Using node transport')
    require('./node/transport')
    return
  }
  if (typeof window !== 'undefined') {
    console.log('[API] Using browser transport')
    require('./browser/transport')
  }
})()
