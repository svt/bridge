const {
  mediaDevices,
  AudioContext,
  GainNode,

  // eslint-disable-next-line no-unused-vars
  MediaStreamAudioSourceNode,
  AudioWorkletNode
} = require('node-web-audio-api')

async function enumerateDevices () {
  const devices = await mediaDevices.enumerateDevices()
  return devices
}
exports.enumerateDevices = enumerateDevices

async function enumerateInputDevices () {
  const devices = await enumerateDevices()
  return devices.filter(device => device?.kind === 'audioinput')
}
exports.enumerateInputDevices = enumerateInputDevices

async function createDeviceStreamSource (audioContext, deviceId) {
  const mediaStream = await mediaDevices.getUserMedia({
    audio: {
      deviceId,
      echoCancellation: false,
      autoGainControl: false,
      noiseSuppression: false
    }
  })
  const source = audioContext.createMediaStreamSource(mediaStream)
  return source
}
exports.createDeviceStreamSource = createDeviceStreamSource

async function createScriptProcessor (audioContext, onData) {
  const processor = audioContext.createScriptProcessor()

  if (typeof onData === 'function') {
    processor.addEventListener('audioprocess', e => onData(e))
  }

  return processor
}
exports.createScriptProcessor = createScriptProcessor

async function createContext (opts) {
  const context = new AudioContext(opts)
  await context.resume()
  return context
}
exports.createContext = createContext

async function createGainNode (audioContext, initialGain = 0) {
  const node = new GainNode(audioContext, { gain: initialGain })
  return node
}
exports.createGainNode = createGainNode

async function createLTCDecoder (ctx, apv) {
  await ctx.audioWorklet.addModule('LTCDecoder.js')
  const processor = new AudioWorkletNode(ctx, 'LTCDecoder', {
    processorOptions: {
      apv
    }
  })

  return processor
}
exports.createLTCDecoder = createLTCDecoder
