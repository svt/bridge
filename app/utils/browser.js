// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Returns whether or not the current
 * window is running as an electron app
 * by checking the user agent
 * @returns { Boolean }
 */
export function isElectron () {
  return window.navigator.userAgent.includes('Bridge')
}
