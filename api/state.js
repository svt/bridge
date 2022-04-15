// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const merge = require('../shared/merge')

const commands = require('./commands')
const events = require('./events')

/**
 * Keep a local
 * copy of the state
 * @type { State }
 */
let state

/**
 * The state's current
 * revision number,
 * this is used to ensure
 * that the state is kept
 * up-to-date
 * @type { Number }
 */
let revision = 0

/**
 * Get the full remote state
 * @returns { Promise.<any> }
 */
function getRemoteState () {
  return commands.executeCommand('state.get')
}

/*
Intercept the state.change event
to always include the full calculated
state
*/
;(function () {
  events.intercept('state.change', async (set, remoteRevision) => {
    revision += 1

    /*
    Make sure the revision numbers match, and if not,
    update the local state from the remote state
    */
    if (revision !== remoteRevision) {
      const newState = await getRemoteState()
      revision = newState._revision
      state = newState
    } else {
      state = merge.deep(state, set)
    }

    return state
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
  if (!state) {
    const newState = await getRemoteState()
    revision = newState._revision
    state = newState
  }
  return state
}
exports.get = get

/**
 * Get the current local
 * copy of the state
 * @returns { Object }
 */
function getLocalState () {
  return state
}
exports.getLocalState = getLocalState
