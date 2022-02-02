/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const communicator = require('./communicator')
const random = require('./random')

const handlers = new Map()

/**
 * Create a handler touple
 * from a function and a
 * return indicator
 *
 * @typedef {{
 *  call: (...Any) => Promise.<Any> | (...Any) => Void,
 *  returns: Boolean
 * }} HandlerTouple
 *
 * @param { (...Any) => Promise.<Any> | (...Any) => Void } fn
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
communicator.onMessage(async message => {
  const handler = handlers.get(message.command)
  if (!handler) return

  if (!handler.returns) {
    handler.call(...message.args)
  } else {
    const args = message.args
    const transaction = args.shift()
    const res = await handler.call(...args)

    executeRawCommand(transaction, res)
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
      unregisterCommand(transaction)

      if (err) return reject(err)
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
  communicator.send({ command, args: [...args] })
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
 *                            defaults to false
 */
function registerCommand (command, handler, returns = true) {
  handlers.set(command, handlerFactory(handler, returns))
  communicator.send({
    command: 'commands.registerCommand',
    args: [command]
  })
}
exports.registerCommand = registerCommand

/**
 * Unregister a command
 * and remove its handler
 * @param { String } command The command to unregister
 */
function unregisterCommand (command) {
  /*
  A plugin can only unregister
  its own commands
  */
  if (!handlers.has(command)) return

  handlers.delete(command)
  communicator.send({
    command: 'commands.unregisterCommand',
    args: [command]
  })
}
exports.unregisterCommand = unregisterCommand
