// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @class LazyValue
 * @description A wrapper around any value that can be awaited
 */
class LazyValue {
  #value

  /**
   * @typedef {{
   *  resolve: () => {}
   * }} PromiseInit
   *
   * @type { PromiseInit[] }
   */
  #promises = []

  /**
   * Set a new value,
   * will resolve any waiting promises
   * @param { any } value
   */
  set (value) {
    this.#value = value

    /*
    Resolve any waiting promises
    */
    for (const promise of this.#promises) {
      promise.resolve(value)
    }
    this.#promises = []
  }

  /**
   * Get the current value
   * @returns { any }
   */
  get () {
    return this.#value
  }

  /**
   * Get the value lazily
   * through a promise,
   *
   * the promise will be resolved
   * as soon as a value is set
   *
   * @returns { Promise.<any> }
   */
  getLazy () {
    if (this.#value) {
      return this.#value
    }
    return new Promise(resolve => {
      this.#promises.push({ resolve })
    })
  }
}

module.exports = LazyValue
