// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * True when running inside the Bridge desktop shell (Electrobun, or
 * legacy Electron). The name is historical — callers really mean
 * "do we have access to the native window/menu API". Detection now
 * uses the preload-injected BRIDGE_TOKEN since Electrobun's WebView
 * does not surface a custom navigator.userAgent the way Electron did.
 * @returns { Boolean }
 */
export function isElectron () {
  /*
  BRIDGE_WINDOW_ID is a plain string property set by the desktop
  preload script. We deliberately do not check BRIDGE_TOKEN here —
  app/auth.js installs a getter on it that returns a Promise, so
  `typeof window.BRIDGE_TOKEN` is always 'object' after the bundle
  runs.
  */
  return typeof window.BRIDGE_WINDOW_ID === 'string' ||
    window.navigator.userAgent.includes('Bridge')
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
