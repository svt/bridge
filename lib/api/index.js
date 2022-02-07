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
 *  executeCommand: executeCommand,
 *  unregisterAllByOwner: unregisterAllByOwner
 * }} CommandApi
 *
 * @typedef {{
 *  commands: CommandApi
 * }} Api
 */

const Logger = require('../Logger')
const logger = new Logger({ name: 'api' })

const CommandHandler = require('./CommandHandler')

const state = require('./state')
const server = require('./server')
const events = require('./events')

/**
 * @param { import('../Workspace') } workspace
 * @returns { Api }
 */
function factory (workspace) {
  /**
   * @type { Map.<String, CommandHandler> }
   */
  const handlers = new Map()

  const api = {
    commands: {}
  }

  /**
   * Remove all handlers registered
   * for a specific owner
   * @param { String } owner
   */
  function unregisterAllByOwner (owner) {
    logger.debug('Unregistering handlers for owner', owner)
    handlers.forEach((handler, command) => {
      if (handler.owner !== owner) return
      handlers.delete(command)
    })
  }
  api.commands.unregisterAllByOwner = unregisterAllByOwner

  /**
   * Register a command to be
   * available through the api
   * @param { String } command
   * @param { GenericCallback } callback
   *//**
   * Register a command to be available through
   * the api and assign it to an owner
   * @param { String } command
   * @param { GenericCallback } callback
   * @param { String } owner
   */
  function registerCommand (command, ...args) {
    logger.debug('Registering command', command)

    const handler = new CommandHandler(...args)
    handlers.set(command, handler)
  }
  api.commands.registerCommand = registerCommand

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
  api.commands.registerAsyncCommand = registerAsyncCommand

  /**
   * Remove a command
   * from the api
   * @param { String } command
   */
  function unregisterCommand (command) {
    logger.debug('Unregistering command', command)
    handlers.delete(command)
  }
  api.commands.unregisterCommand = unregisterCommand

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
    console.log('Handler', handler)
    handler.call(...args)
  }
  api.commands.executeCommand = executeCommand

  /*
  Register the internal functions
  as callable commands
  */
  registerCommand('commands.executeCommand', executeCommand)
  registerCommand('commands.registerCommand', registerCommand)
  registerCommand('commands.unregisterCommand', unregisterCommand)
  registerCommand('commands.unregisterAllByOwner', unregisterAllByOwner)

  /*
  Compose additional apis
  before returning
  */
  state.factory(api, workspace)
  server.factory(api)
  events.factory(api)
  return api
}
exports.factory = factory
