// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const random = require('./random')

const DIController = require('../shared/DIController')

const NoLocalHandlerError = require('./error/NoLocalHandlerError')
const InvalidArgumentError = require('./error/InvalidArgumentError')

/**
 * Create a handler touple
 * from a function and a
 * return indicator
 *
 * @typedef {{
 *  call: (...any) => Promise.<any> | void,
 *  returns: Boolean
 * }} HandlerTouple
 *
 * @param { (...any) => Promise.<any> | void } fn
 * @param { Boolean } returns
 * @returns {{ HandlerTouple }}
 */
function handlerFactory (fn, returns) {
  return {
    call: fn,
    returns
  }
}

class Commands {
  #props

  #handlers = new Map()
  #headers = {}

  constructor (props) {
    this.#props = props
    this.#setup()
  }

  #setup () {
    /*
    Handle incoming messages and
    call the registered handler
    with the provided arguments

    This code is also responsible
    for executing any transactions
    if the handler provides a
    return value
    */
    this.#props.Transport.onMessage(async message => {
      const handler = this.#handlers.get(message.command)
      if (!handler) return

      const args = message.args || []

      if (!handler.returns) {
        handler.call(...args)
      } else {
        const transaction = args.shift()
        try {
          const res = await handler.call(...args)
          this.executeRawCommand(transaction, res)
        } catch (err) {
          this.executeRawCommand(transaction, undefined, {
            message: err.message,
            cause: err.cause,
            stack: err.stack,
            name: err.name
          })
        }
      }
    })
  }

  setHeader (key, value) {
    this.#headers[key] = value
  }

  getHeader (key) {
    return this.#headers[key]
  }

  /**
   * Execute a command
   * @param { String } command A command to execute
   * @param { ...any } args Any arguments to pass to the handler, must be serializable
   * @returns { Promise.<any> }
   */
  executeCommand (command, ...args) {
    return new Promise((resolve, reject) => {
      const transactionId = random.string(12)
      const transaction = `transaction:${transactionId}:${command}`

      this.registerCommand(transaction, (res, err) => {
        this.removeCommand(transaction)
        if (err) {
          const error = new Error(err.message)
          error.stack = err.stack
          error.cause = err.cause
          error.name = err.name
          return reject(error)
        }
        resolve(res)
      }, false)

      this.executeRawCommand(command, transaction, ...args)
    })
  }

  /**
   * Execute a command without
   * creating a transaction
   *
   * No return values are available
   * from commands called with this
   * function, use executeCommand if
   * return values are required
   * @param { String } command The command to execute
   * @param { ...any } args Arguments to pass to the command
   */
  executeRawCommand (command, ...args) {
    this.#props.Transport.send({
      command,
      args: [...args],
      headers: this.#headers
    })
  }

  /**
   * Register a command
   * with a handler
   * @param { String } command The command to register, should be scoped
   * @param {
   *  (...Any) => Promise.<Any> | (...Any) => Void
   * } handler A handler to invoke whenever
   *           the command is run
   * @param { Boolean } returns Indicate whether or not
   *                            the handler returns a value,
   *                            defaults to true
   */
  registerCommand (command, handler, returns = true) {
    if (typeof handler !== 'function') {
      throw new InvalidArgumentError('Parameter \'handler\' must be a function')
    }

    this.#handlers.set(command, handlerFactory(handler, returns))
    this.#props.Transport.send({
      command: 'commands.registerCommand',
      args: [command]
    })
  }

  /**
   * Remove a command
   * and remove its handler
   * @param { String } command The command to remove
   */
  removeCommand (command) {
    /*
    A plugin can only remove
    its own commands
    */
    if (!this.#handlers.has(command)) {
      throw new NoLocalHandlerError('Command cannot be removeed as it wasn\'t created by this plugin')
    }

    this.#handlers.delete(command)
    this.#props.Transport.send({
      command: 'commands.removeCommand',
      args: [command]
    })
  }
}

DIController.main.register('Commands', Commands, [
  'Transport'
])
