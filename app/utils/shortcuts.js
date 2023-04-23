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
 * Call the callback after a delay
 * from the last call to timeoutOnIdle
 *
 * Every direct call to timeoutOnIdle
 * will invalidate the timeout and
 * set a new one
 *
 * @type { Function.<void> }
 * @param { Function.<void> } callback
 * @param { Number } delay The delay in ms
 */
const timeoutOnIdle = (function () {
  let timeout
  return (callback, delay) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(callback, delay)
  }
})()

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
  /*
  Transform all lowercase single letters to their uppercase counterparts
  as we don't want to require setting both 'a' and 'A' as a target
  */
  if (/^[a-z]$/.test(key)) {
    return key.toUpperCase()
  }
  return key
}

/**
 * Register a key down event,
 * will try to find a shortcut
 * matching the currently pressed
 * keys. If found, the 'shortcut' event
 * will be emitted on the target of the
 * key event
 *
 * @param { KeyboardEvent } e
 */
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
    const event = new window.CustomEvent('shortcut', {
      detail: {
        id: shortcut.id
      },
      bubbles: true
    })
    e.target.dispatchEvent(event)
  }

  /*
  Clear the set when input has ended as
  we want to get rid of dangling keys
  */
  timeoutOnIdle(() => keys.clear(), 1000)
}

/**
 * Register a key up event,
 * will remove the released key
 * from the set of pressed keys
 *
 * @param { KeyboardEvent } e
 */
export function registerKeyUp (e) {
  keys.delete(normalize(e.key))
}
