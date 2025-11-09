// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import { LazyValue } from './utils/LazyValue'

const value = new LazyValue()

;(function () {
  Object.defineProperty(window, 'BRIDGE_TOKEN', {
    configurable: true,
    set: newValue => {
      value.set(newValue)
    },
    get: () => value.get()
  })
})()

/**
 * Get the instance's token
 * @returns { Promise.<string | undefined> } The token
 */
export const getToken = () => value.get()
