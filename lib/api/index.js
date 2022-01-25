/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef { (Any) => Void } GenericCallback
 */

const EventEmitter = require('events')

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
  const emitter = new EventEmitter()
  const api = {}

  /**
   * Register a command to
   * be available in the api
   * @param { String } command
   * @param { GenericCallback } handler
   */
  function registerCommand (command, handler) {
    emitter.on(command, handler)
  }
  api.registerCommand = registerCommand

  /**
   * Remove a command
   * from the api
   * @param { String } command
   */
  function unregisterCommand (command) {
    emitter.removeAllListeners(command)
  }
  api.unregisterCommand = unregisterCommand

  /**
   * Execute a command
   * with some data
   * @param { String } command
   * @param { Any } data
   */
  function executeCommand (command, data) {
    emitter.emit(command, data)
  }
  api.executeCommand = executeCommand

  /*
  Register the internal functions
  as callable commands
  */
  registerCommand('commands.executeCommand', executeCommand)
  registerCommand('commands.registerCommand', registerCommand)
  registerCommand('commands.unregisterCommand', unregisterCommand)
}
exports.factory = factory
