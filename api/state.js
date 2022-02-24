// SPDX-FileCopyrightText: 2022 Sveriges Television AB

//
// SPDX-License-Identifier: MIT

const commands = require('./commands')
const events = require('./events')

/**
 * Keep a local
 * copy of the state
 * @type { State }
 */
let state = {}

/*
Listen for changes to the
state and update the local
copy
*/
;(function () {
  events.on('state.change', newState => {
    state = newState
  })
})()

/**
 * Apply some data to the state,
 * most often this function shouldn't
 * be called directly - there's probably
 * a command for what you want to do
 * @param { Object } set Data to apply to the state
 */
function apply (set) {
  commands.executeRawCommand('state.apply', set)
}
exports.apply = apply

/**
 * Get the current state
 * @returns { Promise.<State> }
 */
async function get () {
  return state
}
exports.get = get
