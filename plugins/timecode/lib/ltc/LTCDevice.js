const {
  mediaDevices,
  AudioContext,

  // eslint-disable-next-line no-unused-vars
  MediaStreamAudioSourceNode,
  AudioWorkletNode
} = require('node-web-audio-api')

const DIController = require('../DIController')
const TimecodeDevice = require('../TimecodeDevice')
const TimecodeFrame = require('../TimecodeFrame')

const Logger = require('../../../../lib/Logger')
const logger = new Logger({ name: 'LTCDevice' })

require('./LTCDecoder')

const DEFAULT_SAMPLE_RATE_HZ = 48000

class LTCDevice extends TimecodeDevice {
  #audioContext

  #lastFrameRecvTc

  #processor
  #source

  get frameRate () {
    return this.props.LTCDecoder.frameRate
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
    return this.opts?.deviceId === spec?.deviceId &&
           this.opts?.freeRunFrames === spec?.freeRunFrames &&
           this.props.LTCDecoder.frameRate === spec?.frameRate
  }

  #formatFrame (rawFrameData) {
    return TimecodeFrame.fromPartial(rawFrameData)
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
      this.pushFrame(this.#formatFrame(frame))
      frame = this.props.LTCDecoder.read()
    }
  }

  async #setup () {
    if (!this.opts.deviceId) {
      throw new Error('Missing device id as part of the required options object')
    }

    this.#audioContext = new AudioContext({
      sampleRate: this.opts?.sampleRate || DEFAULT_SAMPLE_RATE_HZ,
      latencyHint: 'interactive'
    })
    const ctx = this.#audioContext

    const mediaStream = await mediaDevices.getUserMedia({
      audio: {
        deviceId: this.opts?.deviceId,
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false
      }
    })

    const source = ctx.createMediaStreamSource(mediaStream)

    await ctx.audioWorklet.addModule('DataWorkletProcessor.js')
    const processor = new AudioWorkletNode(ctx, 'DataWorkletProcessor')

    /*
    Listen for incoming audio data
    buffers from the processor and
    decode them accordingly
    */
    processor.port.onmessage = e => {
      if (!e?.data?.buffer?.buffer) {
        return
      }

      /*
      Throw away frames that arrive
      late due to async processing
      */
      if (this.#lastFrameRecvTc && this.#lastFrameRecvTc > e?.data?.tc) {
        logger.debug('Received outdated frame')
        return
      }

      this.#lastFrameRecvTc = e?.data?.tc

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
    super.close()

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
  'LTCDecoder',
  'Interval'
])
