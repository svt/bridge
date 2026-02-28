// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const environment = require('./shared/environment')

;(function () {
  if (environment.isNode()) {
    require('./node/shortcuts')
    return
  }
  if (environment.isBrowser()) {
    require('./browser/shortcuts')
  }
})()
