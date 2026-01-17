const {
  mediaDevices,
  AudioContext,

  // eslint-disable-next-line no-unused-vars
  MediaStreamAudioSourceNode,
  AudioWorkletNode
} = require('node-web-audio-api')

const DIController = require('../DIController')
const TimecodeDevice = require('../TimecodeDevice')

const Logger = require('../../../../lib/Logger')
const logger = new Logger({ name: 'LTCDevice' })

require('./LTCDecoder')

const DEFAULT_SAMPLE_RATE_HZ = 48000

function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

function formatTimecodeFrame (frame) {
  return `${zeroPad(frame.hours)}:${zeroPad(frame.minutes)}:${zeroPad(frame.seconds)}.${zeroPad(frame.frames)}`
}

/**
 * @typedef {{
 *  sampleRate: number,
 *  frameRate: number,
 *  deviceId: string
 * }} LTCDeviceOptions
 */
class LTCDevice extends TimecodeDevice {
  #audioContext
  #onFrame
  #opts

  #processor
  #source

  /**
   * Create a new ltc device
   * @param { any[] } props
   * @param { LTCDeviceOptions } opts
   * @param { Function } onFrame
   */
  constructor (props, opts = {}, onFrame = () => {}) {
    super(props)
    this.#opts = opts
    this.#onFrame = onFrame
  }

  /**
   * Compare this device
   * to a device spec obtained
   * from Bridge settings
   *
   * Returning true indicates that
   * the device matches the spec
   *
   * @param { any } spec
   * @returns { boolean }
   */
  compareTo (spec) {
    return this.#opts?.deviceId === spec?.deviceId
  }

  #formatFrame (rawFrameData) {
    return {
      days: rawFrameData.days,
      hours: rawFrameData.hours,
      minutes: rawFrameData.minutes,
      seconds: rawFrameData.seconds,
      frames: rawFrameData.frames,
      smpte: formatTimecodeFrame(rawFrameData)
    }
  }

  /**
   * Decode audio data frame
   * buffers into LTC timecode,
   *
   * this.#onFrame will be called
   * for every timecode frame that's
   * successfully decoded
   *
   * @param { Buffer } buffer
   */
  #decodeAudioData (buffer) {
    this.props.LTCDecoder.write(buffer)

    let frame = this.props.LTCDecoder.read()
    while (frame) {
      this.#onFrame(this.#formatFrame(frame))
      frame = this.props.LTCDecoder.read()
    }
  }

  async #setup () {
    if (!this.#opts.deviceId) {
      throw new Error('Missing device id as part of the required options object')
    }

    this.#audioContext = new AudioContext({
      sampleRate: this.#opts?.sampleRate || DEFAULT_SAMPLE_RATE_HZ,
      latencyHint: 'interactive'
    })
    const ctx = this.#audioContext

    const mediaStream = await mediaDevices.getUserMedia({
      audio: {
        deviceId: this.#opts?.deviceId,
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false
      }
    })

    const source = ctx.createMediaStreamSource(mediaStream)

    await ctx.audioWorklet.addModule('DataWorkletProcessor.js')
    const processor = new AudioWorkletNode(ctx, 'DataWorkletProcessor', {
      processorOptions: {
        apv: this.props.LTCDecoder.apv
      }
    })

    /*
    Listen for incoming audio data
    buffers from the processor and
    decode them accordingly
    */
    processor.port.onmessage = e => {
      if (!e?.data?.buffer?.buffer) {
        return
      }
      const buf = Buffer.from(e?.data?.buffer?.buffer)
      this.#decodeAudioData(buf)
    }

    source.connect(processor)
    processor.connect(ctx.destination)

    /*
    Keep references to the nodes in order to
    properly tear them down in the close method
    */
    this.#processor = processor
    this.#source = source
  }

  close () {
    if (this.#audioContext) {
      this.#audioContext.close()
      this.#audioContext = undefined
    }

    if (this.#processor?.port) {
      this.#processor.port.onmessage = undefined
    }
    this.#processor?.disconnect()
    this.#source?.disconnect()
    logger.debug('Closed device')
  }

  async start () {
    if (!this.#audioContext) {
      await this.#setup()
    }
    await this.#audioContext.resume()
    logger.debug('Started device')
  }
}

DIController.register('LTCDevice', LTCDevice, [
  'LTCDecoder'
])
