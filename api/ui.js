// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

;(function () {
  if (module.parent) {
    require('./node/ui')
    return
  }
  if (typeof window !== 'undefined') {
    require('./browser/ui')
  }
})()
