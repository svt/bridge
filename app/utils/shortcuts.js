// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

import hotkeys from 'hotkeys-js'
import * as api from '../api'

const TRANSLATIONS = {
  Meta: () => window.APP.platform === 'darwin' ? 'CommandOrControl' : 'Meta',
  Control: () => 'CommandOrControl',
  '⌘': () => 'CommandOrControl',
  '⌥': () => 'Alt',
  ' ': () => 'Space',
  up: () => 'ArrowUp',
  down: () => 'ArrowDown',
  left: () => 'ArrowLeft',
  right: () => 'ArrowRight'
}

hotkeys('*', async e => {
  const pressed = hotkeys.getPressedKeyString()
    .map(key => normalize(key))
    .map(key => {
      if (TRANSLATIONS[key]) {
        return TRANSLATIONS[key]()
      }
      return key
    })

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
 * @param { String } key The key to normalize
 * @returns { String }
 */
function normalize (key) {
  /*
  Transform all lowercase single letters to their uppercase counterparts
  as we don't want to require setting both 'a' and 'A' as a target
  */
  if (/^([a-z]|f\d+)$/.test(key)) {
    return key.toUpperCase()
  }
  return key
}

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
  dispatchSimulatedEvent('keydown', e)
}

/**
 * Register a key up event,
 * will remove the released key
 * from the set of pressed keys
 *
 * @param { KeyboardEvent } e
 */
export function registerKeyUp (e) {
  dispatchSimulatedEvent('keyup', e)
}

function dispatchSimulatedEvent (type, e) {
  const simulatedEvent = new KeyboardEvent(type, {
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
