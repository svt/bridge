const RATE_LIMIT_DEFAULT_MAX_WAIT_MS = 2000

export class RateLimiter {
  /**
   * @private
   * @type { any }
   */
  _nextValue = undefined
  
  /**
   * @private
   * @type { Number? }
   */
  _timeout = undefined
  
  constructor(maxWait = RATE_LIMIT_DEFAULT_MAX_WAIT_MS) {
    /**
     * @private
     * @type { Number }
     */
    this._maxWait = maxWait
  }
  
  /**
   * Set a new value to the limiter
   * The provided callback will be called
   * with the newest value when updates
   * are not longer being done
   *
   * @param { any } newValue
   * @param { Function.<any> } cb
   */
  newValue (newValue, cb = () => {}) {
    this._nextValue = newValue
    
    if (this._timeout) {
      clearTimeout(this._timeout)
    }
    
    this._timeout = setTimeout(() => {
      this._timeout = undefined
      cb(this._nextValue)
    }, this._maxWait)
  }
}
