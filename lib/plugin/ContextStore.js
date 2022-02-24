// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Logger = require('../Logger')
const logger = new Logger({ name: 'ContextStore' })

/**
 * @class ContextStore
 * @description A class for keeping track
 *              of created plugin contexts,
 *              allowing the retrieval of contexts
 *              from other components
 */
class ContextStore {
  /**
   * Create a new singleton
   * instance of this class
   * @returns { ContextStore }
   */
  static getInstance () {
    if (!this._instance) {
      this._instance = new ContextStore()
    }
    return this._instance
  }

  /**
   * Create a new
   * ContextStore
   */
  constructor () {
    /**
     * @private
     * @type { Map.<String, import('./context').PluginContext> }
     */
    this._store = new Map()
  }

  /**
   * Add a context to the store
   * @param { String } key
   * @param { import("./context").PluginContext } context
   */
  add (key, context) {
    logger.debug('Adding a context for key', key)
    this._store.set(key, context)
  }

  /**
   * Get a context from the
   * store by its key, will return undefined
   * if no context is stored for the key
   * @param { String } key
   * @returns { import('./context').PluginContext | Undefined }
   */
  get (key) {
    return this._store.get(key)
  }

  /**
   * Delete a context from
   * the store by its key
   * @param { String } key
   * @returns { Boolean }
   */
  delete (key) {
    logger.debug('Deleting context for key', key)
    return this._store.delete(key)
  }

  /**
   * Clear the store and delete all
   * references to stored contexts
   */
  clear () {
    this._store.clear()
  }

  /**
   * Deactivate all contexts
   * and their threads
   */
  teardown () {
    this._store.forEach(context => {
      context.deactivate()
    })
  }
}

module.exports = ContextStore
