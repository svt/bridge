// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const commands = require('./commands')
const random = require('./random')

const remoteHandlers = new Map()
const localHandlers = new Map()
const intercepts = new Map()

/**
 * @typedef {{
 *  callee: String
 * }} EventHandlerOpts
 * @property { String } callee An optional identifier for the
 *                             callee of the function,
 *                             this is used to clean up handlers
 *                             when a frame is no longer being used
 */

/**
 * A helper function for appending an
 * item to an array stored in a map
 *
 * If the key is currently empty
 * a new array will be created
 *
 * @param { Map } map A map to modify
 * @param { Any } key The key to the field of the map
 *                    where the array should be stored
 * @param { Any } item An item to append
 */
function appendToMapArray (map, key, item) {
  const items = map.get(key) || []
  map.set(key, [...items, item])
}

/**
 * @private
 *
 * Call all local handlers for an event,
 * this should be called whenever an event
 * is emitted so that all listeners
 * are executed
 *
 * @param { String } event The name of the event to emit
 * @param  { ...any } args Any data to pass along with the event
 */
async function callLocalHandlers (event, ...args) {
  let _args = args

  /*
  Let any intercepts do their thing
  before calling the event handlers
  */
  const interceptFns = intercepts.get(event) || []
  for (const { fn } of interceptFns) {
    _args = await fn(..._args)
  }

  const handlers = localHandlers.get(event)
  for (const { handler } of handlers) {
    handler(..._args)
  }
}

/**
 * Emit an event
 * @param { String } event The name of the event to emit
 * @param  { ...any } args Any data to pass along with the event
 */
function emit (event, ...args) {
  commands.executeRawCommand('events.emit', event, ...args)
}
exports.emit = emit

/**
 * Emit an event but only call local handlers
 *
 * This will NOT trigger any listeners outside
 * this client. If that is what you want,
 * use the standard 'emit' function instead.
 *
 * @param { String } event The name of the event to emit
 * @param  { ...any } args Any data to pass along with the event
 */
function emitLocally (event, ...args) {
  callLocalHandlers(event, ...args)
}
exports.emitLocally = emitLocally

/**
 * Register a function that intercepts a certain event
 * before calling any handlers with its result
 * @param { String } event The name of the event to intercept
 * @param { (any[]) => any[] } handler A function intercepting the event,
 *                                     it must resolve to an array of values
 * @param { EventHandlerOpts } opts
 */
function intercept (event, handler, opts) {
  const fn = async function (...args) {
    const res = await handler(...args)
    if (Array.isArray(res)) return res
    return [res]
  }
  appendToMapArray(intercepts, event, { fn, callee: opts?.callee })
}
exports.intercept = intercept

/**
 * Remove an intercepting function
 * from an event
 * @param { String } event
 * @param { (any[]) => any[] } handler
 */
function removeIntercept (event, handler) {
  const handlers = intercepts.get(event)
  if (!handlers) {
    return
  }

  const index = handlers.findIndex(({ fn }) => fn === handler)
  handlers.splice(index, 1)

  if (handlers.length === 0) {
    intercepts.delete(event)
  } else {
    intercepts.set(event, handlers)
  }
}
exports.removeIntercept = removeIntercept

/**
 * Add a handler for an event
 * @param { String } event An event to listen to
 * @param { EventHandler } handler A handler to be called
 *                                 when the event is received
 * @param { EventHandlerOpts } opts
 * @returns { Promise.<void> }
 */
async function on (event, handler, opts) {
  appendToMapArray(localHandlers, event, { handler, callee: opts?.callee })

  /*
  Only setup the command if
  we have just one listener
  */
  if (localHandlers.get(event).length === 1) {
    const command = `event:${random.string(12)}:${event}`

    /*
    Register a command handle that will trigger
    all local handlers of the event
    */
    commands.registerCommand(command, async (...args) => {
      callLocalHandlers(event, ...args)
    }, false)

    const handlerId = await commands.executeCommand('events.triggerCommand', event, command)
    remoteHandlers.set(event, [command, handlerId])
  }
}
exports.on = on

/**
 * Add a handler for an event but only
 * call it the first time the event is
 * received
 * @param { String } event An event to listen to
 * @param { EventHandler } handler A handler to call
 * @param { EventHandlerOpts } opts
 */
function once (event, handler, opts) {
  function handle (...args) {
    off(event, handle)
    handler(...args)
  }
  on(event, handle, opts)
}
exports.once = once

/**
 * Remove a handler for an event
 * @param { String } event An event name
 * @param { EventHandler } handler A handler to remove
 */
function off (event, handler) {
  if (!localHandlers.has(event)) return

  const handlers = localHandlers.get(event)
  const index = handlers.findIndex(({ handler: _handler }) => _handler === handler)
  handlers.splice(index, 1)

  if (handlers.length === 0) {
    localHandlers.delete(event)

    if (!remoteHandlers.has(event)) {
      return
    }

    /*
    Remove the command completely as we don't
    have any handlers for this event anymore
    */
    const [command, handlerId] = remoteHandlers.get(event)
    commands.removeCommand(command)
    commands.executeRawCommand('events.off', event, handlerId)

    remoteHandlers.delete(event)
  } else {
    localHandlers.set(event, handlers)
  }
}
exports.off = off

/**
 * Remove all listeners
 *//**
 * Remove all listeners associated
 * with the specified callee
 * @param { String } callee
 */
function removeAllListeners (callee) {
  for (const event of localHandlers.keys()) {
    for (const { handler, callee: _callee } of localHandlers.get(event)) {
      if (callee && _callee !== callee) {
        continue
      }
      off(event, handler)
    }
  }
}
exports.removeAllListeners = removeAllListeners

/**
 * Remove all intercepts
 *//**
 * Remove all intercepts associated
 * with the specified callee
 * @param { String } callee
 */
function removeAllIntercepts (callee) {
  for (const event of intercepts.keys()) {
    for (const { fn, callee: _callee } of intercepts.get(event)) {
      if (callee && _callee !== callee) {
        continue
      }
      removeIntercept(event, fn)
    }
  }
}
exports.removeAllIntercepts = removeAllIntercepts

/**
 * Check if there is a registered
 * remote handler for an event
 * @param { String } event
 * @returns { Boolean }
 */
function hasRemoteHandler (event) {
  return remoteHandlers.has(event)
}
exports.hasRemoteHandler = hasRemoteHandler
