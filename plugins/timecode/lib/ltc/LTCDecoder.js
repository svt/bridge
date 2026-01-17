const { LTCDecoder: NativeLTCDecoder } = require('libltc-wrapper')
const DIController = require('../DIController')
const DIBase = require('../../../../shared/DIBase')

const DEFAULT_SAMPLE_RATE_HZ = 48000
const DEFAULT_FRAME_RATE_HZ = 25
const DEFAULT_AUDIO_FORMAT = 'float'

class LTCDecoder extends DIBase {
  #nativeDecoder

  get apv () {
    return this.#nativeDecoder.apv
  }

  constructor (props, sampleRate = DEFAULT_SAMPLE_RATE_HZ, frameRate = DEFAULT_FRAME_RATE_HZ, format = DEFAULT_AUDIO_FORMAT) {
    super(props)
    this.#nativeDecoder = new NativeLTCDecoder(sampleRate, frameRate, format)
  }

  write (buffer) {
    this.#nativeDecoder.write(buffer)
  }

  read () {
    return this.#nativeDecoder.read()
  }
}

DIController.register('LTCDecoder', LTCDecoder)
