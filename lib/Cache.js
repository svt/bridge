// Copyright © 2021 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Logger = require('./logger')
const logger = new Logger({ name: 'Cache' })

const DEFAULT_ENTRY_LIFETIME_MS = 10000

class CacheEntry {
  /**
   * Get the immutable
   * data stored by
   * this entry
   * @type { Any }
   */
  get data () {
    return this._data
  }

  /**
   * A boolean indicating whether
   * or not this entry
   * is still valid
   * @type { Boolean }
   */
  get isValid () {
    return this._expires > Date.now()
  }

  /**
   * A boolean indicating
   * if this entry should be
   * kept as a fallback value
   * even though it's expired
   * @type { Boolean }
   */
  get keep () {
    return this._keep
  }

  constructor (data, lifetime, keep) {
    /**
     * @private
     * A reference to the data
     * stored in this entry
     * @type { Any }
     */
    this._data = data

    /**
     * @private
     * Denote if this entry is meant to be
     * kept in memory even though it's expired,
     * this can be useful when wanting to provide
     * an expired value in case a provider function
     * fails
     * @type { Boolean }
     */
    this._keep = keep

    /**
     * @private
     * The time this entry
     * expires in milliseconds
     * @type { Number }
     */
    this._expires = Date.now() + lifetime
  }
}

class Cache {
  constructor () {
    /**
     * @private
     * An key-value store
     * holding cached data
     * @type { Object.<String, CacheEntry> }
     */
    this._store = {}
  }

  /**
   * Store some data in the cache
   * @param { String }    key A key used to identify the data
   * @param { Any }       data Any data to store
   * @param { Number }    lifetime The lifetime of the data in milliseconds
   * @param { Boolean }   keep Whether or not to keep the data
   *                           even though it's expired, this is useful
   *                           for providing fallback values
   */
  store (key, data, lifetime = DEFAULT_ENTRY_LIFETIME_MS, keep = false) {
    logger.debug('Caching data for key', key)
    const entry = new CacheEntry(data, lifetime, keep)
    this._store[key] = entry
  }

  /**
   * Get some data by its key,
   * this will return valid data
   * and data marked with keep=true
   * @param { String } key The key used when storing the data
   * @returns { Any? }
   */
  get (key) {
    const entry = this._store[key]
    if (entry?.isValid || entry?.keep) {
      return entry?.data
    }
    this._store[key] = undefined
  }

  /**
   * Cache the return value
   * of an async function,
   * this is useful for expensive
   * functions which should only
   * be run if the cache has expired
   * @param { String }                  key A key to identify the data
   * @param { Function.<Promise<Any>> } fn A function returning a promise
   *                                       resolving to some data to cache
   * @param { Number }                  lifetime The lifetime of the data in milliseconds
   * @param { Boolean }                 keep A boolean indicating whether or not
   *                                         the cached data should be kept even
   *                                         though it's expired
   * @returns
   */
  async cache (key, fn, lifetime, keep) {
    if (this._store[key]?.isValid) {
      logger.debug('Cache hit for key', key)
      return this._store[key].data
    }
    logger.debug('Cache miss for key', key)

    return fn()
      .then(res => {
        this.store(key, res, lifetime, keep)
        return res
      })
      .catch(() => this._store[key]?.data)
  }

  /**
   * Clear this cache's store and
   * remove all stored entries
   */
  clear () {
    logger.debug('Clearing cache')
    this._store = {}
  }
}

module.exports = Cache
