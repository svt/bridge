// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Returns a promise that resolves
 * after the given delay
 * @param { Number } delayMs
 * @returns { Promise.<void> }
 */
function wait (delayMs) {
  return new Promise(resolve => {
    setTimeout(() => resolve(), delayMs)
  })
}
exports.wait = wait
