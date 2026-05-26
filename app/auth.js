// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import { LazyValue } from './utils/LazyValue'

const value = new LazyValue()

;(function () {
  /*
  In the legacy Electron flow the token landed via executeJavaScript
  AFTER the bundle had already installed this accessor, triggering the
  setter. In Electrobun the token is injected via a preload script that
  runs BEFORE the bundle, so by the time we get here the property is
  already a data property holding the JWT string. Capture that value
  before defineProperty replaces the descriptor — otherwise the LazyValue
  never resolves and getToken() blocks forever.
  */
  const preloaded = typeof window.BRIDGE_TOKEN === 'string'
    ? window.BRIDGE_TOKEN
    : undefined

  Object.defineProperty(window, 'BRIDGE_TOKEN', {
    configurable: true,
    set: newValue => {
      value.set(newValue)
    },
    get: () => value.get()
  })

  if (preloaded !== undefined) {
    value.set(preloaded)
  }
})()

/**
 * Get the instance's token
 * @returns { Promise.<string | undefined> } The token
 */
export const getToken = () => value.get()
