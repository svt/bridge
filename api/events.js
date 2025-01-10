// SPDX-FileCopyrightText: 2025 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const random = require('./random')

const DIController = require('../shared/DIController')

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

class Events {
  #props

  #remoteHandlers = new Map()
  #localHandlers = new Map()
  #intercepts = new Map()

  constructor (props) {
    this.#props = props
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
  async callLocalHandlers (event, ...args) {
    let _args = args

    const handlers = this.#localHandlers.get(event)
    if (!handlers) {
      return
    }

    /*
    Let any intercepts do their thing
    before calling the event handlers
    */
    const interceptFns = this.#intercepts.get(event) || []
    for (const { fn } of interceptFns) {
      _args = await fn(..._args)
    }

    for (const { handler } of handlers) {
      handler(..._args)
    }
  }

  /**
   * Emit an event
   * @param { String } event The name of the event to emit
   * @param  { ...any } args Any data to pass along with the event
   */
  emit (event, ...args) {
    this.#props.Commands.executeRawCommand('events.emit', event, ...args)
  }

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
  emitLocally (event, ...args) {
    this.callLocalHandlers(event, ...args)
  }

  /**
   * Register a function that this.#intercepts a certain event
   * before calling any handlers with its result
   * @param { String } event The name of the event to intercept
   * @param { (any[]) => any[] } handler A function intercepting the event,
   *                                     it must resolve to an array of values
   * @param { EventHandlerOpts } opts
   */
  intercept (event, handler, opts) {
    const fn = async function (...args) {
      const res = await handler(...args)
      if (Array.isArray(res)) return res
      return [res]
    }
    appendToMapArray(this.#intercepts, event, { fn, callee: opts?.callee })
  }

  /**
   * Remove an intercepting function
   * from an event
   * @param { String } event
   * @param { (any[]) => any[] } handler
   */
  removeIntercept (event, handler) {
    const handlers = this.#intercepts.get(event)
    if (!handlers) {
      return
    }

    const index = handlers.findIndex(({ fn }) => fn === handler)
    handlers.splice(index, 1)

    if (handlers.length === 0) {
      this.#intercepts.delete(event)
    } else {
      this.#intercepts.set(event, handlers)
    }
  }

  /**
   * Add a handler for an event
   * @param { String } event An event to listen to
   * @param { EventHandler } handler A handler to be called
   *                                 when the event is received
   * @param { EventHandlerOpts } opts
   * @returns { Promise.<void> }
   */
  async on (event, handler, opts) {
    appendToMapArray(this.#localHandlers, event, { handler, callee: opts?.callee })

    /*
    Only setup the command if
    we have just one listener
    */
    if (this.#localHandlers.get(event).length === 1) {
      const command = `event:${random.string(12)}:${event}`

      /*
      Register a command handle that will trigger
      all local handlers of the event
      */
      this.#props.Commands.registerCommand(command, async (...args) => {
        this.callLocalHandlers(event, ...args)
      }, false)

      const handlerId = await this.#props.Commands.executeCommand('events.triggerCommand', event, command)
      this.#remoteHandlers.set(event, [command, handlerId])
    }
  }

  /**
   * Add a handler for an event but only
   * call it the first time the event is
   * received
   * @param { String } event An event to listen to
   * @param { EventHandler } handler A handler to call
   * @param { EventHandlerOpts } opts
   */
  once (event, handler, opts) {
    function handle (...args) {
      this.off(event, handle)
      handler(...args)
    }
    this.on(event, handle.bind(this), opts)
  }

  /**
   * Remove a handler for an event
   * @param { String } event An event name
   * @param { EventHandler } handler A handler to remove
   */
  off (event, handler) {
    if (!this.#localHandlers.has(event)) return

    const handlers = this.#localHandlers.get(event)
    const index = handlers.findIndex(({ handler: _handler }) => _handler === handler)
    handlers.splice(index, 1)

    if (handlers.length === 0) {
      this.#localHandlers.delete(event)

      if (!this.#remoteHandlers.has(event)) {
        return
      }

      /*
      Remove the command completely as we don't
      have any handlers for this event anymore
      */
      const [command, handlerId] = this.#remoteHandlers.get(event)
      this.#props.Commands.removeCommand(command)
      this.#props.Commands.executeRawCommand('events.off', event, handlerId)

      this.#remoteHandlers.delete(event)
    } else {
      this.#localHandlers.set(event, handlers)
    }
  }

  /**
   * Remove all listeners
   *//**
  * Remove all listeners associated
  * with the specified callee
  * @param { String } callee
  */
  removeAllListeners (callee) {
    for (const event of this.#localHandlers.keys()) {
      for (const { handler, callee: _callee } of this.#localHandlers.get(event)) {
        if (callee && _callee !== callee) {
          continue
        }
        this.off(event, handler)
      }
    }
  }

  /**
   * Remove all this.#intercepts
   *//**
  * Remove all this.#intercepts associated
  * with the specified callee
  * @param { String } callee
  */
  removeAllIntercepts (callee) {
    for (const event of this.#intercepts.keys()) {
      for (const { fn, callee: _callee } of this.#intercepts.get(event)) {
        if (callee && _callee !== callee) {
          continue
        }
        this.removeIntercept(event, fn)
      }
    }
  }

  /**
   * Check if there is a registered
   * remote handler for an event
   * @param { String } event
   * @returns { Boolean }
   */
  hasRemoteHandler (event) {
    return this.#remoteHandlers.has(event)
  }
}

DIController.main.register('Events', Events, [
  'Commands'
])
