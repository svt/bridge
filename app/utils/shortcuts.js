// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

import hotkeys from 'hotkeys-js'
import * as api from '../api'

/**
 * @typedef {{
 *  id: string
 * }} Shortcut
 *
 * @typedef { string[] } KeyboardTrigger
 */

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

const DELIMITER = '+'

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

  const shortcuts = await findShortcuts(pressed)
  const items = await findItemTriggers(pressed)
  e.preventDefault()

  /*
  Execute registered shortcuts
  */
  if (Array.isArray(shortcuts) && shortcuts.length > 0) {
    for (const match of shortcuts) {
      dispatchShortcutEvent(match.action)
    }
  }

  /*
  Execute keyboard triggers
  */
  if (Array.isArray(items) && items.length > 0) {
    for (const item of items) {
      playItem(item?.id)
    }
  }
})

/**
 * Compare two triggers,
 * returns true if equivalent
 * regardless of the order
 * of the keys
 * @param { KeyboardTrigger } triggerA
 * @param { KeyboardTrigger } triggerB
 * @returns { boolean }
 */
function compareTriggers (triggerA, triggerB) {
  if (triggerA.length !== triggerB.length) {
    return false
  }
  for (const key of triggerA) {
    if (!triggerB.includes(key)) {
      return false
    }
  }
  return true
}

/**
 * Find all shortcuts
 * matching a trigger
 * @param { KeyboardTrigger } trigger
 * @returns { Promise.<Shortcut[] | undefined> }
 */
async function findShortcuts (trigger) {
  const bridge = await api.load()
  const shortcuts = await bridge.shortcuts.getShortcuts()

  if (!shortcuts || !Array.isArray(shortcuts)) {
    return
  }

  return shortcuts
    .filter(shortcut => compareTriggers(shortcut.trigger, trigger))
}

/**
 * Find all keyboard trigger
 * items matching a trigger
 * @param { KeyboardTrigger } trigger
 * @returns { Promise.<Item[] | undefined> }
 */
async function findItemTriggers (trigger) {
  const bridge = await api.load()
  const items = await bridge.state.get('items')

  if (!items || typeof items !== 'object') {
    return
  }

  return Object.values(items)
    .filter(item => item.type === 'bridge.types.keyboardTrigger')
    .map(item => [item, String(item?.data?.keybinding).split(DELIMITER)])
    .filter(([, itemTrigger]) => compareTriggers(itemTrigger, trigger))
    .map(([item]) => item)
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
  if (typeof action !== 'string') {
    return
  }
  const bridge = await api.load()
  bridge.shortcuts.dispatchShortcut(action)
}

/**
 * Play an item
 * @param { string } id
 */
async function playItem (id) {
  if (typeof id !== 'string') {
    return
  }
  const bridge = await api.load()
  bridge.items.playItem(id)
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
