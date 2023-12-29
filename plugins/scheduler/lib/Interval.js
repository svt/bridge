// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @class An interval that adjusts for the drift
 *        caused by setTimeout and setInterval
 */
class Interval {
  set delay (newValue) {
    this._delay = newValue
  }

  get delay () {
    return this._delay
  }

  /**
   * Instantiate a new interval
   * @param { Number } delay The delay in milliseconds
   * @param { Function<void> } fn A callback function to call
   *                              every time the interval fires
   */
  constructor (delay, fn = () => {}) {
    /**
     * @private
     * @type { Number }
     */
    this._delay = delay

    /**
     * @private
     * @type { Function<void> }
     */
    this._fn = fn
  }

  /**
   * Start the interval
   */
  start () {
    if (!this._timeout) {
      this._loop()
    }
  }

  /**
   * Stop the interval
   */
  stop () {
    if (!this._timeout) {
      return
    }
    clearTimeout(this._timeout)
  }

  /**
   * @private
   */
  _loop () {
    const now = Date.now()
    const drift = Math.max((now - this._lastTrigger) - this._delay, 0)
    const delay = this._delay - drift

    this._lastTrigger = now

    /*
    Execute the
    callback
    */
    this._fn(now)

    this._timeout = setTimeout(() => {
      this._loop()
    }, delay)
  }
}

module.exports = Interval
