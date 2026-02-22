const DIController = require('./DIController')

/**
 * @class An interval that adjusts for the drift
 *        caused by setTimeout and setInterval
 */
class Interval {
  #lastTrigger
  #timeout
  #delay
  #fn

  set delay (newValue) {
    this.#delay = newValue
  }

  get delay () {
    return this.#delay
  }

  set callback (newValue) {
    this.#fn = newValue
  }

  get callback () {
    return this.#fn
  }

  get isRunning () {
    return this.#timeout != null
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
    this.#delay = delay

    /**
     * @private
     * @type { Function<void> }
     */
    this.#fn = fn
  }

  /**
   * Start the interval
   */
  start () {
    if (!this.#timeout) {
      this.#loop()
    }
  }

  /**
   * Stop the interval
   */
  stop () {
    if (!this.#timeout) {
      return
    }
    clearTimeout(this.#timeout)
    this.#timeout = undefined
  }

  /**
   * @private
   */
  #loop () {
    const now = Date.now()
    const drift = Math.max((now - this.#lastTrigger) - this.#delay, 0)
    const delay = this.#delay - drift

    this.#lastTrigger = now

    /*
    Execute the
    callback
    */
    this.#fn(now)

    this.#timeout = setTimeout(() => {
      this.#loop()
    }, delay)
  }
}

DIController.register('Interval', Interval)
