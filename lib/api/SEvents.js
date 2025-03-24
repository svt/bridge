// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef { () => {} } EventHandler
 */

const uuid = require('uuid')

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const Handler = require('./CommandHandler')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Events api' })

class SEvents extends DIBase {
  /**
   * @type { Map.<String, Map.<String, Handler> }
   */
  #events = new Map()

  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerCommand('events.off', this.off.bind(this))
    this.props.SCommands.registerCommand('events.emit', this.emit.bind(this))
    this.props.SCommands.registerCommand('events.removeAllByOwner', this.removeAllByOwner.bind(this))
    this.props.SCommands.registerAsyncCommand('events.on', this.on.bind(this))
    this.props.SCommands.registerAsyncCommand('events.triggerCommand', this.triggerCommand.bind(this))
  }

  /**
   * Emit an event
   * @param { String } event The name of the
   *                         event to emit
   * @param  { ...any[] } args Any arguments
   * @returns
   */
  emit (event, ...args) {
    logger.debug('Emitting event', event)

    const handlers = this.#events.get(event)
    if (!handlers) return

    handlers.forEach(handler => {
      handler.call(...args)
    })
  }

  /**
   * Add a new handler
   * for an event
   * @param { String } event An event to listen to
   * @param { EventHandler } handler A handler to call
   * @returns { String } An id for the handler
   *//**
   * Add a new owned handler
   * for an event
   * @param { String } event An event to listen to
   * @param { EventHandler } handler A handler to call
   * @param { String } owner The owner of the handler
   * @returns { String } An id for the handler
   */
  on (event, handler, owner) {
    logger.debug('Adding handler for event', event)

    const id = uuid.v4()
    if (!this.#events.has(event)) {
      this.#events.set(event, new Map())
    }
    this.#events.get(event).set(id, new Handler(handler, owner))
    return id
  }

  /**
   * Remove a handler for an
   * event by its identifier
   * @param { String } event An event name
   * @param { String } id A handler id to remove
   */
  off (event, id) {
    logger.debug('Removing handler for event', event)

    const handlers = this.#events.get(event)
    if (!handlers) return

    if (handlers.size === 1) {
      this.#events.delete(event)
    } else {
      handlers.delete(id)
    }
  }

  /**
   * Trigger a command when
   * an event is fired
   *
   * This is useful for plugins
   * wanting to listen for events
   * @param { String } event An event to listen for
   * @param { String } command A command to trigger
   * @returns { String } An identifier for the created listener
   *//**
   * Trigger a command when
   * an event is fired
   * @param { String } event An event to listen for
   * @param { String } command A command to trigger
   * @param { String } owner The owner of this listener
   * @returns { String } An identifier for the created listener
   */
  triggerCommand (event, command, owner) {
    return this.on(event, (...args) => {
      this.props.SCommands.executeCommand(command, ...args)
    }, owner)
  }

  /**
   * Check if there are any
   * registered handlers for an event
   * @returns { Boolean }
   */
  hasHandlersForEvent (event) {
    return !!this.#events.get(event)?.size
  }

  /**
   * Remove all handlers owned
   * by a specific owner
   * @param { String } owner The identifier of an owner
   */
  removeAllByOwner (owner) {
    logger.debug('Removing handlers for owner', owner)
    this.#events.forEach((handlers, event) => {
      handlers.forEach((handler, id) => {
        if (handler.owner !== owner) return
        handlers.delete(id)
      })
      if (handlers.size === 0) {
        this.#events.delete(event)
      }
    })
  }
}

DIController.main.register('SEvents', SEvents, [
  'SCommands'
])
