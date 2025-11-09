// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import { LazyValue } from './utils/LazyValue'

const value = new LazyValue()

;(function () {
  Object.defineProperty(window, 'bridge', {
    configurable: true,
    set: newValue => {
      value.set(newValue)
    },
    get: () => value.get()
  })
})()

/**
 * A lazy value to await
 * in order to get the api
 * @returns { Promise.<any> }
 */
export const load = () => value.get()
