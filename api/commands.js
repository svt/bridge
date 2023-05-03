// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const transport = require('./transport')
const random = require('./random')

const handlers = new Map()

const NoLocalHandlerError = require('./error/NoLocalHandlerError')

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

/*
Handle incoming messages and
call the registered handler
with the provided arguments

This code is also responsible
for executing any transactions
if the handler provides a
return value
*/
transport.onMessage(async message => {
  const handler = handlers.get(message.command)
  if (!handler) return

  const args = message.args || []

  if (!handler.returns) {
    handler.call(...args)
  } else {
    const transaction = args.shift()
    try {
      const res = await handler.call(...args)
      executeRawCommand(transaction, res)
    } catch (err) {
      executeRawCommand(transaction, undefined, err)
    }
  }
})

/**
 * Execute a command
 * @param { String } command A command to execute
 * @param { ...any } args Any arguments to pass to the handler, must be serializable
 * @returns { Promise.<any> }
 */
function executeCommand (command, ...args) {
  return new Promise((resolve, reject) => {
    const transactionId = random.string(12)
    const transaction = `transaction:${transactionId}:${command}`

    registerCommand(transaction, (res, err) => {
      removeCommand(transaction)

      if (err) {
        console.error(err)
        return reject(err)
      }
      resolve(res)
    }, false)

    executeRawCommand(command, transaction, ...args)
  })
}
exports.executeCommand = executeCommand

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
function executeRawCommand (command, ...args) {
  transport.send({ command, args: [...args] })
}
exports.executeRawCommand = executeRawCommand

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
function registerCommand (command, handler, returns = true) {
  handlers.set(command, handlerFactory(handler, returns))
  transport.send({
    command: 'commands.registerCommand',
    args: [command]
  })
}
exports.registerCommand = registerCommand

/**
 * Remove a command
 * and remove its handler
 * @param { String } command The command to remove
 */
function removeCommand (command) {
  /*
  A plugin can only remove
  its own commands
  */
  if (!handlers.has(command)) {
    throw new NoLocalHandlerError('Command cannot be removeed as it wasn\'t created by this plugin')
  }

  handlers.delete(command)
  transport.send({
    command: 'commands.removeCommand',
    args: [command]
  })
}
exports.removeCommand = removeCommand
