// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Logger = require('../Logger')
const logger = new Logger({ name: 'api' })

const Handler = require('./Handler')

const state = require('./state')
const types = require('./types')
const items = require('./items')
const server = require('./server')
const events = require('./events')
const window = require('./window')
const settings = require('./settings')
const shortcuts = require('./shortcuts')
const variables = require('./variables')

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
  function removeAllByOwner (owner) {
    logger.debug('Removing handlers for owner', owner)
    handlers.forEach((handler, command) => {
      if (handler.owner !== owner) return
      handlers.delete(command)
    })
  }
  api.commands.removeAllByOwner = removeAllByOwner

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

    const handler = new Handler(...args)
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
      removeCommand(transaction)
    })
  }
  api.commands.registerAsyncCommand = registerAsyncCommand

  /**
   * Remove a command
   * from the api
   * @param { String } command
   */
  function removeCommand (command) {
    logger.debug('Removing command', command)
    handlers.delete(command)
  }
  api.commands.removeCommand = removeCommand

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
    handler.call(...args)
  }
  api.commands.executeCommand = executeCommand

  /*
  Register the internal functions
  as callable commands
  */
  registerCommand('commands.removeCommand', removeCommand)
  registerCommand('commands.executeCommand', executeCommand)
  registerCommand('commands.registerCommand', registerCommand)
  registerCommand('commands.removeAllByOwner', removeAllByOwner)

  /*
  Compose additional apis
  before returning
  */
  state.factory(api, workspace)
  types.factory(api, workspace)
  items.factory(api, workspace)
  server.factory(api)
  events.factory(api)
  window.factory(api, workspace)
  settings.factory(api, workspace)
  shortcuts.factory(api, workspace)
  variables.factory(api, workspace)
  return api
}
exports.factory = factory
