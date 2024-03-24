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
 *
 * Please note that this
 * value only will be updated
 * if there are listeners for
 * state changes attached by
 * the current process
 *
 * @type { Number }
 */
let revision = 0

/**
 * Get the full remote state
 * @returns { Promise.<any> }
 *//**
 * Get a part of the remote state
 * specified by a dot notated path
 * @param { String } path
 * @returns { Promise.<any> }
 */
function getRemoteState (path) {
  return commands.executeCommand('state.get', path)
}

/**
 * Apply state changes to
 * the local copy of the state
 * @param { Object[] } set An array of objects to set
 *//**
 * Apply a single change to
 * the local copy of the state
 * @param { Object } set An object to set
 */
function applyLocally (set) {
  if (Array.isArray(set)) {
    for (const change of set) {
      state = merge.deep(state, change)
    }
  } else {
    state = merge.deep(state, set)
  }
}

/*
Intercept the state.change event
to always include the full calculated
state
*/
;(function () {
  events.intercept('state.change', async (set, remoteRevision, transparent) => {
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
      applyLocally(set)
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
 *//**
 * Apply some data to the state,
 * most often this function shouldn't
 * be called directly - there's probably
 * a command for what you want to do
 * @param { Object[] } set An array of data objects to
 *                         apply to the state in order
 */
function apply (set) {
  commands.executeRawCommand('state.apply', set)
}
exports.apply = apply

/**
 * Get the full current state
 * @returns { Promise.<State> }
 *//**
 * Get part of the current state
 * specified by a dot-notated path
 * @param { String } path
 * @returns { Promise.<State> }
 */
async function get (path) {
  const newState = await getRemoteState(path)
  if (!path) {
    revision = newState._revision
    state = newState
    return state
  } else {
    return newState
  }
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
