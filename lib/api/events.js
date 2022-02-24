// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const uuid = require('uuid')

const Handler = require('./Handler')

const Logger = require('../Logger')
const logger = new Logger({ name: 'Events api' })

function factory (api) {
  api.events = {}

  /**
   * @type { Map.<String, Map.<String, Handler> }
   */
  const events = new Map()

  /**
   * Emit an event
   * @param { String } event The name of the
   *                         event to emit
   * @param  { ...any[] } args Any arguments
   * @returns
   */
  function emit (event, ...args) {
    logger.debug('Emitting event', event)

    const handlers = events.get(event)
    if (!handlers) return

    handlers.forEach(handler => {
      handler.call(...args)
    })
  }
  api.events.emit = emit

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
  function on (event, handler, owner) {
    logger.debug('Adding handler for event', event)

    const id = uuid.v4()
    if (!events.has(event)) {
      events.set(event, new Map())
    }
    events.get(event).set(id, new Handler(handler, owner))
    return id
  }
  api.events.on = on

  /**
   * Remove a handler for an
   * event by its identifier
   * @param { String } event An event name
   * @param { String } id A handler id to remove
   */
  function off (event, id) {
    logger.debug('Removing handler for event', event)

    const handlers = events.get(event)
    if (!handlers) return

    if (handlers.size === 1) {
      events.delete(event)
    } else {
      handlers.delete(id)
    }
  }
  api.events.off = off

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
  function triggerCommand (event, command, owner) {
    return on(event, (...args) => {
      api.commands.executeCommand(command, ...args)
    }, owner)
  }

  /**
   * Remove all handlers owned
   * by a specific owner
   * @param { String } owner The identifier of an owner
   */
  function removeAllByOwner (owner) {
    logger.debug('Removing handlers for owner', owner)
    events.forEach((handlers, event) => {
      handlers.forEach(handler => {
        if (handler.owner !== owner) return
        handlers.delete(handler)
      })
      if (handlers.size === 0) {
        events.delete(event)
      }
    })
  }
  api.events.removeAllByOwner = removeAllByOwner

  api.commands.registerCommand('events.off', off)
  api.commands.registerCommand('events.emit', emit)
  api.commands.registerCommand('events.removeAllByOwner', removeAllByOwner)
  api.commands.registerAsyncCommand('events.on', on)
  api.commands.registerAsyncCommand('events.triggerCommand', triggerCommand)
}
exports.factory = factory
