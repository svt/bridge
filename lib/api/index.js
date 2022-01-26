/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef { (Any) => Void } GenericCallback
 */

const Logger = require('../Logger')
const logger = new Logger({ name: 'api' })

/**
 *
 * @typedef {{
 *  registerCommand: registerCommand,
 *  unregisterCommand: unregisterCommand,
 *  executeCommand: executeCommand
 * }} Api
 *
 * @param { import('../Workspace') } workspace
 * @returns { Api }
 */
function factory (workspace) {
  const handlers = new Map()
  const api = {}

  /**
   * Register a command to
   * be available in the api
   * @param { String } command
   * @param { GenericCallback } handler
   */
  function registerCommand (command, handler) {
    logger.debug('Registering command', command, handler)
    handlers.set(command, handler)
  }
  api.registerCommand = registerCommand

  /**
   * Remove a command
   * from the api
   * @param { String } command
   */
  function unregisterCommand (command) {
    logger.debug('Unregistering command', command)
    handlers.delete(command)
  }
  api.unregisterCommand = unregisterCommand

  /**
   * Execute a command
   * with some data
   * @param { String } command
   * @param { Any } data
   */
  function executeCommand (command, ...args) {
    logger.debug('Executing command', command, args)
    const handler = handlers.get(command)

    if (!handler) {
      logger.debug('No such command', command)
      return
    }

    handler(...args)
  }
  api.executeCommand = executeCommand

  /*
  Register the internal functions
  as callable commands
  */
  registerCommand('commands.executeCommand', executeCommand)
  registerCommand('commands.registerCommand', registerCommand)
  registerCommand('commands.unregisterCommand', unregisterCommand)

  /**
   * Apply some arbitrary
   * data to the state
   *
   * This function only exists
   * to run the apply function
   * the correct scope
   * @param { Object } set Some data to set
   */
  function applyState (set) {
    workspace.state.apply(set)
  }

  registerCommand('state.apply', applyState)

  return api
}
exports.factory = factory
