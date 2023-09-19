const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'TimingPlugin/Timer' })

class Timer {
  get duration () {
    return this._duration
  }

  /**
   * Check whether or not
   * this timer is paused
   * 
   * Pause and resume the timer using
   * the methods pause() and resume()
   * 
   * @type { Boolean }
   */
  get isPaused () {
    return this.state === Timer.state.paused
  }

  /**
   * Check whether or not
   * this timer is finished
   * @type { Boolean }
   */
  get isFinished () {
    return this.state === Timer.state.finished
  }

  /**
   * @private
   * @type { Number }
   * @example
   * 0 = running
   * 1 = finished
   */
  _state = Timer.state.running

  get state () {
    return this._state
  }

  /**
   * Get the available
   * states as an enum
   * @type {{
   *  paused: Number,
   *  running: Number,
   *  finished: Number
   * }}
   */
  static get state () {
    return Object.freeze({
      running: 'running',
      paused: 'paused',
      finished: 'finished'
    })
  }

  /**
   * @private
   * @type { Number }
   */
  _lastTick

  /**
   * @private
   * @type { Number }
   */
  _remaining

  /**
   * @private
   * @type { Number }
   */
  _duration

  get remaining () {
    return this._remaining
  }

  /**
   * @param { Number } duration The duration of the timer in milliseconds
   */
  constructor (duration) {
    this._duration = duration
    this._remaining = duration
  }

  pause () {
    this._state = Timer.state.paused
  }

  resume () {
    if (!this.isPaused) {
      return
    }
    this._lastTick = Date.now()
    this._state = Timer.state.running
  }

  /**
   * Tick the timer,
   * if finished this function will return 'true'
   * @returns { Boolean } Whether or not this timer is finished
   */
  tick () {
    if (this.isFinished) {
      return true
    }

    if (this.isPaused) {
      return false
    }

    if (!this._lastTick) {
      this._lastTick = Date.now()
    }

    const now = Date.now()
    this._remaining -= now - this._lastTick
    this._lastTick = now

    if (this._remaining <= 0) {
      this._state = Timer.state.finished
      return true
    }

    return false
  }

  serialize () {
    return [
      this.remaining,
      this.duration,
      this.state
    ]
  }
}

module.exports = Timer