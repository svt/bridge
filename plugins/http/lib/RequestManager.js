const random = require('./random')

/**
 * @description
 * Keeps track of calls to fetch and
 * their abort controllers and abstracts
 * abortion into convenient functions
 * based on item ids
 *
 * This class supports keeping track of
 * multiple simultaneous requests per item
 *
 * @typedef {{
 *  fetchFunction: (String, any) => {}
 * }} RequestManagerOpts
 */
class RequestManager {
  /**
   * A two-dimensional index for keeping
   * track of abortion controllers
   *
   * Level 1: item ids
   * Level 2: request ids
   *
   * {
   *  itemId: {
   *    requestId: AbortionController,
   *    requestId: AbortionController,
   *    requestId: AbortionController
   *  }
   * }
   */
  #index = new Map()

  /**
   * The fetch function to use when making requests,
   * this is mostly here to make testing easier
   */
  #fetchFunction = global.fetch

  /**
   * @param { RequestManagerOpts } opts
   */
  constructor (opts = {}) {
    if (typeof opts?.fetchFunction === 'function') {
      this.#fetchFunction = opts.fetchFunction
    }
  }

  /**
   * Count all abortion controllers that
   * are currently in the state for an item
   * @param { String } itemId
   * @returns { Number }
   */
  countControllersForItem (itemId) {
    const controllers = this.#index.get(itemId)
    if (!controllers) {
      return 0
    }
    return Object.keys(controllers).length
  }

  /**
   * Make a request and manage its
   * relation to an item id
   * @param { String } itemId
   * @param { String } url
   * @param { RequestInit } opts
   * @param  { ...any } args
   * @returns { Promise.<Response> }
   */
  makeRequestForItemWithId (itemId, url, opts, ...args) {
    const controller = new AbortController()

    const currentRequestControllers = this.#index.get(itemId) || {}
    const currentRequestIds = Object.keys(currentRequestControllers)

    const requestId = random.makeUniqueId(4, currentRequestIds)

    this.#index.set(itemId, {
      ...currentRequestControllers,
      [requestId]: controller
    })

    return this.#fetchFunction(url, { ...opts, signal: controller.signal }, ...args)
      .finally(() => {
        this.#removeRequestById(itemId, requestId)
      })
  }

  /**
   * Remove a request from the index
   * by its item- and request ids
   *
   * This will NOT call
   * abort on its controller
   *
   * @param { String } itemId
   * @param { String } requestId
   */
  #removeRequestById (itemId, requestId) {
    const controllers = this.#index.get(itemId) || {}
    delete controllers[requestId]

    if (Object.keys(controllers).length === 0) {
      this.#index.delete(itemId)
    }

    this.#index.set(itemId, { ...controllers })
  }

  /**
   * Call abort on all abortion controllers
   * currently kept in the index for an itemId
   * @param { String } itemId
   */
  abortAllRequestsForItemId (itemId) {
    const controllers = this.#index.get(itemId)
    if (!controllers) {
      return
    }

    for (const controller of Object.values(controllers)) {
      controller.abort()
    }

    this.#index.delete(itemId)
  }
}

module.exports = RequestManager
