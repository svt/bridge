// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

;(function () {
  if (module.parent) {
    require('./node/client')
    return
  }
  if (typeof window !== 'undefined') {
    require('./browser/client')
  }
})()
