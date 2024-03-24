// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const InvalidArgumentError = require('../error/InvalidArgumentError')

/**
 * @class Cache
 * @description A simple in-memory cache
 *              that can store any type
 *              of data
 */
class Cache {
  /**
   * @private
   * A map containing the cache's index,
   * mapping keys to cache entries
   *
   * @typedef {{
   *  status: 'pending' | undefined,
   *  promise: Promise | undefined,
   *  value: any
   * }} Entry
   *
   * @type { Map.<String, Entry> }
   */
  #index = new Map()

  /**
   * @private
   * @type { Number }
   */
  #maxEntries

  constructor (maxEntries = 10) {
    this.#maxEntries = maxEntries
  }

  /**
   * @private
   * Prepare the cache index for insertion,
   * this will make sure that the index
   * stays within the set max size
   */
  #prepareIndexForInsertion () {
    if (this.#index.size < this.#maxEntries) {
      return
    }
    const firstKey = this.#index.keys().next().value
    this.#index.delete(firstKey)
  }

  /**
   * Get a cached value
   * by its key
   * @param { String } key
   * @returns { Promise.<any> }
   */
  get (key) {
    const entry = this.#index.get(key)

    /*
    If there is a pending promise for the value,
    return that rather than starting a new request
    */
    if (
      entry &&
      entry.status === 'pending' &&
      entry.promise
    ) {
      return entry.promise
    }
    return Promise.resolve(this.#index.get(key)?.value)
  }

  /**
   * Cache the response of a provider function,
   * the response will be returned if there's
   * a valid entry in the cache index
   *
   * If there's a cache hit,
   * the provider function
   * will not be called
   *
   * If the cache is waiting for the provider
   * while a new request is made, a promise will
   * be returned to the first request value,
   * avoiding multiple simultaneous requests
   * for the same data
   *
   * @param { String } key
   * @param { Function.<Promise.<any>> } provider
   * @returns { Promise.<any> }
   */
  async cache (key, provider) {
    if (typeof key !== 'string') {
      throw new InvalidArgumentError('The provided key must be a string')
    }

    if (typeof provider !== 'function') {
      throw new InvalidArgumentError('The provided provider must be a function')
    }

    if (this.#index.has(key)) {
      return this.get(key)
    }

    /*
    Create a promise that can be used
    to return the fetched value to all
    waiting recipients
    */
    let resolve
    let reject
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve
      reject = _reject
    })

    this.#prepareIndexForInsertion()
    this.#index.set(key, { status: 'pending', promise })

    try {
      const value = await provider()
      this.#index.set(key, { value })
      resolve(value)
    } catch (e) {
      reject(e)
      this.#index.delete(key)
    }

    return promise
  }
}

module.exports = Cache
