const DIBase = require('../../../shared/DIBase')
const Logger = require('../../../lib/Logger')

const TimecodeFrame = require('./TimecodeFrame')

const logger = new Logger({ name: 'TimecodeDevice' })

/**
 * @typedef {{
 *  frameRate: number,
 *  freeRunFrames: number
 * }} TimecodeDeviceOptions
 */

const DEFAULT_FREE_RUN_FRAME_COUNT = 0

class TimecodeDevice extends DIBase {
  #opts
  #onFrame

  #missedFrames = 0
  #lastFrame
  #nextFrame

  static get DEFAULT_FREE_RUN_FRAME_COUNT () {
    return DEFAULT_FREE_RUN_FRAME_COUNT
  }

  get freeRunFrames () {
    return this.#opts?.freeRunFrames ?? DEFAULT_FREE_RUN_FRAME_COUNT
  }

  get frameRate () {
    return this.#opts?.frameRate
  }

  get opts () {
    return this.#opts
  }

  /**
   * Create a new timecode device
   * @param { any[] } props
   * @param { TimecodeDeviceOptions } opts
   * @param { Function } onFrame
   */
  constructor (props, opts = {}, onFrame = () => {}) {
    super(props)
    this.#opts = opts
    this.#onFrame = onFrame
  }

  compareTo (spec) {
    throw new Error('Subclass has not implemented the compareTo method, this is a requirement for all TimecodeDevice subclasses')
  }

  pushFrame (frame) {
    /*
    Restart the interval whenever
    we're restarting the catchup or
    pushing the first frame so that
    the interval always follows the tc
    */
    if (!this.props.Interval.isRunning || !this.#nextFrame) {
      this.#stopInterval()
      this.#setupInterval()
    }
    this.#nextFrame = frame
  }

  /**
   * Callback for the interval/internal clock
   * which will calculate the device synk state (locked/reset/freerun)
   *
   * - Locked = We're following the input
   * - Reset = We've lost the input and are not calculating frames atm
   * - Free run = Frames are dropped but we're filling them in ourselves
   *
   * This function will call the external
   * callback with the correct frame
   *
   * @returns
   */
  #onInternalFrame () {
    if (!this.#nextFrame) {
      return
    }

    if (!this.#lastFrame) {
      this.#lastFrame = this.#nextFrame
      this.#onFrame(this.#nextFrame)
      return
    }

    if (!this.frameRate) {
      logger.warn('Frame rate is not set for device, unable to calculate next frame')
      return
    }

    let outFrame
    let expectedFrame

    try {
      expectedFrame = TimecodeFrame.next(this.#lastFrame, this.frameRate)
    } catch (err) {
      logger.warn(err.message)
    }

    if (expectedFrame && TimecodeFrame.compare(expectedFrame, this.#nextFrame)) {
      /*
      Locked
      */
      this.#missedFrames = 0
      outFrame = this.#nextFrame
    } else {
      if (this.#missedFrames >= this.freeRunFrames) {
        /*
        Reset
        */
        this.#missedFrames = 0
        this.#nextFrame = undefined
        this.#lastFrame = undefined
        return
      } else {
        /*
        Free run
        */
        this.#missedFrames++
        outFrame = expectedFrame
      }
    }

    this.#lastFrame = outFrame
    this.#onFrame(outFrame)
  }

  #setupInterval () {
    this.props.Interval.delay = 1000 / this.frameRate
    this.props.Interval.callback = this.#onInternalFrame.bind(this)
    this.props.Interval.start()
  }

  #stopInterval () {
    if (this.props.Interval) {
      this.props.Interval.stop()
    }
  }

  close () {
    this.#stopInterval()
  }
}
module.exports = TimecodeDevice
