const { Agent: PolicyAgent } = require('node-policy-agent')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Commands api' })

const CommandHandler = require('./CommandHandler')

const ApiError = require('../error/ApiError')

const rules = require('./rules')

class SCommands extends DIBase {
  /**
   * @type { Map.<String, CommandHandler> }
   */
  #handlers = new Map()

  #policyAgent = new PolicyAgent(rules, { detailedResponse: true })

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.registerCommand('commands.removeCommand', this.removeCommand.bind(this))
    this.registerCommand('commands.registerCommand', this.registerCommand.bind(this))
    this.registerCommand('commands.removeAllByOwner', this.removeAllByOwner.bind(this))
  }

  /**
   * Remove all handlers registered
   * for a specific owner
   * @param { String } owner
   */
  removeAllByOwner (owner) {
    logger.debug('Removing handlers for owner', owner)
    this.#handlers.forEach((handler, command) => {
      if (handler.owner !== owner) return
      this.#handlers.delete(command)
    })
  }

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
  registerCommand (command, callback, owner) {
    logger.debug('Registering command', command)

    if (this.#handlers.has(command)) {
      throw new ApiError(`Unable to register command "${command}" as it already exist`, 'ERR_API_COMMANDS_REGISTER_CONFLICT')
    }

    const handler = new CommandHandler(callback, owner)
    this.#handlers.set(command, handler)
  }

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
  registerAsyncCommand (command, handler) {
    this.registerCommand(command, async (transaction, ...args) => {
      /*
      Wait for the command to execute
      and use its response value to
      execute the transaction
      */
      try {
        const res = await handler(...args)
        this.executeCommand(transaction, res)
      } catch (err) {
        this.executeCommand(transaction, undefined, err)
      }
      this.removeCommand(transaction)
    })
  }

  /**
   * Check whether a command
   * is registered or not
   *
   * @param { String } command
   * @returns { Boolean }
   */
  hasCommand (command) {
    return this.#handlers.has(command)
  }

  /**
   * Remove a command
   * from the api
   * @param { String } command
   */
  removeCommand (command) {
    logger.debug('Removing command', command)
    this.#handlers.delete(command)
  }

  /**
   * Execute a command
   * with some data
   * @param { String } command
   * @param { Any } ctx
   * @param { Any } data
   */
  executeCommand (command, ...args) {
    const handler = this.#handlers.get(command)

    if (!handler) {
      logger.warn('No such command', `"${command}"`)
      return
    }
    handler.call(...args)
  }

  async authorizeCommand (ctx, command, ...args) {
    const { granted } = this.#policyAgent.authorize({
      command
    })
    return granted
  }

  async authorizeAndExecuteCommand (ctx, command, ...args) {
    const authorized = await this.authorizeCommand(ctx, command, ...args)

    if (!authorized) {
      logger.warn(`Access denied to execute command "${command}"`)
      return
    }
    return this.executeCommand(command, ...args)
  }

  contextFactory () {
    return {
      ts: Date.now()
    }
  }
}

DIController.main.register('SCommands', SCommands)
