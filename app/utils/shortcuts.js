// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import * as api from '../api'

/**
 * A set for keeping track of the
 * currently pressed keys
 * @type { Set.<String> }
 */
const keys = new Set()

/**
 * Normalize a key name in order
 * to more easily target specific keys
 *
 * - Lower case keys are all transformed to upper case
 *
 * @param { String } key The key to normalize
 * @returns { String }
 */
function normalize (key) {
  if (/[a-z]/.test(key)) {
    return key.toUpperCase()
  }
  return key
}

export async function registerKeyDown (e) {
  const bridge = await api.load()
  const shortcuts = await bridge.shortcuts.getShortcuts()

  keys.add(normalize(e.key))

  const matchedShortcuts = shortcuts.filter(shortcut => {
    for (const trigger of shortcut.trigger) {
      if (!keys.has(trigger)) {
        return false
      }
    }
    return true
  })

  if (matchedShortcuts.length === 0) {
    return
  }

  for (const shortcut of matchedShortcuts) {
    /*
    Run logic to determine of we're
    triggering a shortcut
    */
    const event = new window.CustomEvent('shortcut', {
      detail: {
        id: shortcut.id
      },
      bubbles: true
    })
    e.target.dispatchEvent(event)
  }
}

export function registerKeyUp (e) {
  keys.delete(normalize(e.key))
}
