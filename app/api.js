// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Load the api
 * @returns { Promise.<any> } The api
 */
export const load = (function () {
  let bridge = window.bridge
  let resolvers = []

  if (!bridge) {
    /*
    Observe window.bridge and resolve all
    pending promises as soon as it's set
    */
    Object.defineProperty(window, 'bridge', {
      configurable: true,
      set: value => {
        bridge = value
        resolvers.forEach(resolve => resolve(bridge))
        resolvers = undefined
      },
      get: () => bridge
    })
  }

  return () => {
    if (bridge) {
      return Promise.resolve(bridge)
    }
    return new Promise(resolve => {
      resolvers.push(resolve)
    })
  }
})()
