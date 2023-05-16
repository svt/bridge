// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const keys = new Set()

/**
 * Check if a key is currently pressed
 * @param { String } key The name of the key to check
 * @returns { Boolean } Whether or not the key is pressed
 */
export function keyIsPressed (key) {
  return keys.has(key.toLowerCase())
}

;(function () {
  window.addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase())
  }, true)

  window.addEventListener('keyup', e => {
    keys.delete(e.key.toLowerCase())
  }, true)

  window.addEventListener('blur', e => {
    keys.clear()
  })
})()
