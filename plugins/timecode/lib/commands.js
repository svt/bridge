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
async function addLTCInput (description) {
  /*
  Generate a new id for
  referencing the target
  */
  description.id = uuid.v4()

  const targetArray = await bridge.state.get(`${paths.STATE_SETTINGS_PATH}.targets`) || []
  if (targetArray.length > 0) {
    bridge.state.apply(`plugins.${manifest.name}.targets`, { $push: [description] })
  } else {
    bridge.state.apply(`plugins.${manifest.name}.targets`, [description])
  }

  return description.id
}
exports.addLTCInput = addLTCInput
bridge.commands.registerCommand('timecode.addLTCInput', addLTCInput)

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
