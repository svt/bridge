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

/**
 * Get the current platform as a string
 * @return { String }
 */
export function platform () {
  const alternatives = [
    {
      if: value => value.indexOf('mac') >= 0,
      newValue: 'darwin'
    },
    {
      if: value => value.indexOf('linux') >= 0,
      newValue: 'linux'
    },
    {
      if: value => value.indexOf('win') >= 0,
      newValue: 'windows'
    }
  ]
  const nav = window.navigator.platform

  for (const match of alternatives) {
    if (match.if(nav.toLowerCase())) {
      return match.newValue
    }
  }
  return nav
}
