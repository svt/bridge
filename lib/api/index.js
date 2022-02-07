/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 *
 * @typedef { (Any) => Void } GenericCallback
 *
 * @typedef {{
 *  registerCommand: registerCommand,
 *  registerAsyncCommand: registerAsyncCommand,
 *  unregisterCommand: unregisterCommand,
 *  executeCommand: executeCommand
 * }} Api
 */

const Logger = require('../Logger')
const logger = new Logger({ name: 'api' })

const server = require('./server')
const events = require('./events')

/**
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
    logger.debug('Registering command', command)
    handlers.set(command, handler)
  }
  api.registerCommand = registerCommand

  /**
   * Register a command that
   * can return an async value
   *
   * This is only for internal use
   * and should not be exposed in
   * the api
   * @param { String } command A command to register
   * @param { (...any) => Promise.<any> } handler A handler for the command
   */
  function registerAsyncCommand (command, handler) {
    registerCommand(command, async (transaction, ...args) => {
      /*
      Wait for the command to execute
      and use its response value to
      execute the transaction
      */
      try {
        const res = await handler(...args)
        executeCommand(transaction, res)
      } catch (err) {
        executeCommand(transaction, undefined, err)
      }
      unregisterCommand(transaction)
    })
  }
  api.registerAsyncCommand = registerAsyncCommand

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

  /*
  Compose additional apis
  before returning
  */
  api.server = server.factory(api)
  api.events = events.factory(api, workspace)
  return api
}
exports.factory = factory
