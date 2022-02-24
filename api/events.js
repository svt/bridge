// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const commands = require('./commands')
const random = require('./random')

const remoteHandlers = new Map()
const localHandlers = new Map()

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
 * Emit an event
 * @param { String } event The name of the event to emit
 * @param  { ...any } args Any data to pass along with the event
 */
function emit (event, ...args) {
  commands.executeRawCommand('events.emit', event, ...args)
}
exports.emit = emit

/**
 * Add a handler for an event
 * @param { String } event An event to listen to
 * @param { EventHandler } handler A handler to be called
 *                                 when the event is received
 * @returns { Promise.<void> }
 */
async function on (event, handler) {
  appendToMapArray(localHandlers, event, handler)

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
    commands.registerCommand(command, (...args) => {
      const handlers = localHandlers.get(event)
      for (const handler of handlers) {
        handler(...args)
      }
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
 */
function once (event, handler) {
  function handle (...args) {
    off(event, handle)
    handler(...args)
  }
  on(event, handle)
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
  const index = handlers.indexOf(handler)
  handlers.splice(index, 1)

  if (handlers.length === 0) {
    localHandlers.delete(event)

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
