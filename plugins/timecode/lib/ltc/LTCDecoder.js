const { LTCDecoder: NativeLTCDecoder } = require('libltc-wrapper')
const DIController = require('../DIController')
const DIBase = require('../../../../shared/DIBase')

const DEFAULT_SAMPLE_RATE_HZ = 48000
const DEFAULT_FRAME_RATE_HZ = 25
const DEFAULT_AUDIO_FORMAT = 'float'

const SUPPORTED_FRAME_RATES = [24, 25, 30]

class LTCDecoder extends DIBase {
  #nativeDecoder

  static get DEFAULT_SAMPLE_RATE_HZ () {
    return DEFAULT_SAMPLE_RATE_HZ
  }

  static get DEFAULT_FRAME_RATE_HZ () {
    return DEFAULT_FRAME_RATE_HZ
  }

  static get DEFAULT_AUDIO_FORMAT () {
    return DEFAULT_AUDIO_FORMAT
  }

  static get SUPPORTED_FRAME_RATES () {
    return SUPPORTED_FRAME_RATES
  }

  /**
   * Check if a provided frame rate
   * is supported by the decoder
   * @param { number } frameRate
   * @returns { boolean }
   */
  static isSupportedFrameRate (frameRate) {
    return SUPPORTED_FRAME_RATES.includes(frameRate)
  }

  #frameRate

  /**
   * Get the frame rate
   * of this decoder
   * @type { number }
   */
  get frameRate () {
    return this.#frameRate
  }

  constructor (props, sampleRate = DEFAULT_SAMPLE_RATE_HZ, frameRate = DEFAULT_FRAME_RATE_HZ, format = DEFAULT_AUDIO_FORMAT) {
    super(props)

    let _frameRate = frameRate
    if (!LTCDecoder.isSupportedFrameRate(frameRate)) {
      _frameRate = LTCDecoder.DEFAULT_FRAME_RATE_HZ
    }

    this.#frameRate = _frameRate
    this.#nativeDecoder = new NativeLTCDecoder(sampleRate, _frameRate, format)
  }

  write (buffer) {
    this.#nativeDecoder.write(buffer)
  }

  read () {
    return this.#nativeDecoder.read()
  }
}

DIController.register('LTCDecoder', LTCDecoder)
module.exports = LTCDecoder
