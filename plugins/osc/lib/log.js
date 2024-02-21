// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')
const manifest = require('../package.json')

/**
 * Define the max length of the log stack,
 * the oldest items will get pushed off the
 * stack when this limit is reached
 * @type { Number }
 */
const STACK_MAX_LENGTH = 100

let stack = []
let didLoadStackFromState = false

/**
 * Add a log to the stack
 *
 * @param {{
 *  timestamp: Number,
 *  direction: 'in' | 'out',
 *  address: String
 * }} logInit
 */
function addLog (logInit) {
  stack.splice(0, stack.length + 1 - STACK_MAX_LENGTH)
  stack.push(logInit)

  if (didLoadStackFromState) {
    return bridge.state.apply({
      plugins: {
        [manifest.name]: {
          log: { $replace: stack }
        }
      }
    })
  }

  return bridge.state.apply({
    plugins: {
      [manifest.name]: {
        log: stack
      }
    }
  })
}
exports.addLog = addLog

/*
If available read the stack
from the state on init
*/
;(async function () {
  const currentStack = await bridge.state.get(`plugins.${manifest.name}.log`)
  if (Array.isArray(currentStack)) {
    didLoadStackFromState = true
    stack = currentStack
  }
})()
