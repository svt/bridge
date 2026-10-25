const bridge = require('bridge')

/**
 * Get all commands that plugins have opted in to
 * exposing through the commands.list command
 * @returns { Promise.<{ id: string, description: string, args?: object }[]> }
 */
async function getExposedCommands () {
  return (await bridge.commands.executeCommand('commands.list')) || []
}

module.exports = { getExposedCommands }
