export const TIMING_FUNCTIONS = Object.freeze({
  linear: t => t
})

export class Animation {
  #running = false
  #timingFunction
  #durationMs
  #startTime
  #onFrame
  #from
  #to

  constructor (from, to, durationMs, timingFunction = TIMING_FUNCTIONS.linear, onFrame = () => {}) {
    this.#timingFunction = timingFunction
    this.#durationMs = durationMs
    this.#onFrame = onFrame
    this.#from = from
    this.#to = to
  }

  #loop () {
    if (!this.#running) {
      return
    }
    this.#frame()
    requestAnimationFrame(this.#loop.bind(this))
  }

  #frame () {
    const progress = Math.min(1, Math.max(0, (Date.now() - this.#startTime) / this.#durationMs))
    const timed = this.#timingFunction(progress)

    const value = this.#from + (this.#to - this.#from) * timed

    if (typeof this.#onFrame === 'function') {
      this.#onFrame(value, timed)
    }
  }

  start () {
    this.#startTime = Date.now()
    this.#running = true
    this.#loop()
  }

  stop () {
    this.#running = false
  }
}
