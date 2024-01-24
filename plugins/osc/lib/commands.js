// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  id: String?,
 *  name: String,
 *  host: String,
 *  port: Number
 * }} TargetDescription
 */

const bridge = require('bridge')

const uuid = require('uuid')

const manifest = require('../package.json')
const paths = require('./paths')

/**
 * Add a new target
 * from a description object
 * @param { TargetDescription } description
 * @returns { Promise.<String> } A promise resolving
 *                               to the target's id
 */
async function addTarget (description) {
  /*
  Generate a new id for
  referencing the target
  */
  description.id = uuid.v4()

  const targetArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.targets`) || []
  if (targetArray.length > 0) {
    bridge.state.apply({
      plugins: {
        [manifest.name]: {
          targets: { $push: [description] }
        }
      }
    })
  } else {
    bridge.state.apply({
      plugins: {
        [manifest.name]: {
          targets: [description]
        }
      }
    })
  }

  return description.id
}
exports.addTarget = addTarget
bridge.commands.registerCommand('osc.addTarget', addTarget)

/**
 * Update the state from
 * a new description
 * @param { String } targetId The id of the server to edit
 * @param { TargetDescription } description A new target init object
 *                                          to apply to the target
 */
async function editTarget (targetId, description) {
  const targetArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.targets`) || []
  const newTargetArray = [...targetArray]
    .map(target => {
      if (target.id !== targetId) {
        return target
      }
      return description
    })

  /*
  Return early if there are no targets in the array
  as we don't want to set a bad state
  */
  if (newTargetArray.length === 0) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        targets: { $replace: newTargetArray }
      }
    }
  })
}
exports.editTarget = editTarget
bridge.commands.registerCommand('osc.editTarget', editTarget)

/**
 * Get a single target by its id
 * @param { String } targetId
 * @returns { TargetDescription | undefined }
 */
async function getTarget (targetId) {
  const targets = (await bridge.state.get(`plugins.${manifest.name}.targets`)) || []
  if (!Array.isArray(targets)) {
    return
  }

  return targets.find(target => target.id === targetId)
}
exports.getTarget = getTarget
bridge.commands.registerCommand('osc.getTarget', getTarget)

/**
 * Remove a target by its id
 * @param { String } targetId The id of the
 *                            target to remove
 */
async function removeTarget (targetId) {
  const targetArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.targets`) || []
  if (!Array.isArray(targetArray)) {
    return
  }

  const newTargetArray = [...targetArray]
    .filter(target => target.id !== targetId)

  /*
  Return early if no target with the specified id was
  found as we don't need to update the state
  */
  if (newTargetArray.length === targetArray.length) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        targets: { $replace: newTargetArray }
      }
    }
  })
}
exports.removeTarget = removeTarget
bridge.commands.registerCommand('osc.removeTarget', removeTarget)
