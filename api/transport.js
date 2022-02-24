// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const transport = (function () {
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
