// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * True when running under Electrobun.
 * Set by lib/electrobun-runtime/index.ts before any other module loads.
 * @returns { Boolean }
 */
function isElectrobun () {
  return globalThis.__BRIDGE_ELECTROBUN__ === true
}
exports.isElectrobun = isElectrobun

/**
 * True when running as a desktop application (currently always
 * equivalent to isElectrobun, but kept as a separate concept so
 * call sites read clearly).
 * @returns { Boolean }
 */
function isDesktop () {
  return isElectrobun()
}
exports.isDesktop = isDesktop
