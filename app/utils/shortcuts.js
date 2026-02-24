// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

import hotkeys from 'hotkeys-js'
import * as api from '../api'

const TRANSLATIONS = {
  Meta: () => window.APP.platform === 'darwin' ? 'CommandOrControl' : 'Meta',
  MetaLeft: () => window.APP.platform === 'darwin' ? 'CommandOrControl' : 'Meta',
  MetaRight: () => window.APP.platform === 'darwin' ? 'CommandOrControl' : 'Meta',
  Control: () => 'CommandOrControl',
  ControlLeft: () => 'CommandOrControl',
  ControlRight: () => 'CommandOrControl',
  '⌘': () => 'CommandOrControl',
  '⌥': () => 'Alt',
  ' ': () => 'Space',
  '⇧': () => 'Shift',
  '⌃': () => 'CommandOrControl',
  Up: () => 'ArrowUp',
  Down: () => 'ArrowDown',
  Left: () => 'ArrowLeft',
  Right: () => 'ArrowRight'
}

/**
 * Internal state for enabling
 * and disabling shortcuts
 *
 * @type { boolean }
 */
let isEnabled = true

/**
 * Disable all
 * keyboard shortcuts
 */
export function enable () {
  isEnabled = true
}

/**
 * Enable all
 * keyboard shortcuts
 */
export function disable () {
  isEnabled = false
}

hotkeys('*', async e => {
  if (!isEnabled) {
    return
  }

  const pressed = getPressed()

  const matches = await findMatches(pressed)
  if (matches.length === 0) {
    return
  }

  e.preventDefault()

  for (const match of matches) {
    dispatchShortcutEvent(match.action)
  }
})

async function findMatches (trigger) {
  const bridge = await api.load()
  const shortcuts = await bridge.shortcuts.getShortcuts()

  const matches = shortcuts
    .filter(shortcut => {
      return shortcut.trigger.length === trigger.length
    })
    .filter(shortcut => {
      for (const key of shortcut.trigger) {
        if (!trigger.includes(key)) {
          return false
        }
      }
      return true
    })

  return matches
}

/**
 * Normalize a key name in order
 * to more easily target specific keys
 *
 * - Lower case keys are all transformed to upper case
 *
 * @example
 * 'a' -> 'A'
 * 'Meta' -> 'Meta'
 *
 * @param { string } key The key to normalize
 * @returns { string }
 */
function normalize (key) {
  if (typeof key !== 'string') {
    return
  }

  /*
  Make sure that the first letter is always capitalized
  to treat a as A and backspace as Backspace
  */
  return `${key}`.charAt(0).toUpperCase() + `${key}`.slice(1)
}

/**
 * Dispatch the shortcut event through the Bridge API,
 * this is called when a shortcut with an action is recognized
 * @param { string } action
 * @returns
 */
async function dispatchShortcutEvent (action) {
  if (!action) {
    return
  }
  const bridge = await api.load()
  bridge.events.emitLocally('shortcut', action)
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
  dispatchSimulatedEvent(e)
}

/**
 * Register a key up event,
 * will remove the released key
 * from the set of pressed keys
 *
 * @param { KeyboardEvent } e
 */
export function registerKeyUp (e) {
  dispatchSimulatedEvent(e)
}

/**
 * Dispatch a simulated keyboard event
 * for hotkeys to recognize
 *
 * This is used to forward key events
 * from iFrames
 *
 * @param { KeyboardEvent } e
 */
function dispatchSimulatedEvent (e) {
  if (e?.type !== 'keyup' && e?.type !== 'keydown') {
    console.warn('[Shortcuts] Can only simulate keyup and keydown events')
    return
  }

  const simulatedEvent = new KeyboardEvent(e.type, {
    key: e.key,
    code: e.code,
    ctrlKey: e.ctrlKey,
    metaKey: e.metaKey,
    shiftKey: e.shiftKey,
    keyCode: e.keyCode,
    which: e.which,
    altKey: e.altKey,
    bubbles: true,
    cancelable: true
  })

  document.dispatchEvent(simulatedEvent)
}

/**
 * Get all currently
 * pressed keys
 *
 * @returns { string[] }
 */
export function getPressed () {
  return hotkeys.getPressedKeyString()
    .map(key => normalize(key))
    .map(key => {
      if (TRANSLATIONS[key]) {
        return TRANSLATIONS[key]()
      }
      return key
    })
}
