// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @class Accumulator
 * @description This can be used when multiple values needs to be passed
 *              to the same function but are provided over time
 */
class Accumulator {
  /**
   * @private
   * The number of milliseconds during which
   * the accumulator will collect values before
   * executing the callback
   * @type { Number }
   */
  #interval = 100

  /**
   * @private
   * @type { Function.<void> }
   */
  #callback

  /**
   * @private
   * An array containing all the values
   * that are collected for the next
   * execution of the callback
   *
   * Will be reset on every
   * execution of the callback
   * @type { any[] }
   */
  #values = []

  /**
   * @param { Number } interval The number of milliseconds to wait for more values
   *                            before executing the callback
   * @param { Function.<void> } callback A callback function which will be
   *                                     executed when the interval has expired
   */
  constructor (interval, callback = () => {}) {
    this.#interval = interval
    this.#callback = callback
  }

  /**
   * Add a value to be provided
   * to the callback on the next
   * execution
   *
   * Also trigger a timeout
   * to start the execution
   * if none is already
   * triggered
   *
   * @param { any } value
   */
  add (value) {
    if (this.#values.length === 0) {
      setTimeout(() => {
        this.#callback(this.#values)
        this.#values = []
      }, this.#interval)
    }
    this.#values.push(value)
  }
}

module.exports = Accumulator
