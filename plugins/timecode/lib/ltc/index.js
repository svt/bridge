const { LTCDecoder } = require('libltc-wrapper')

function createDecoder (sampleRate = 48000, frameRate = 25, format = 'u8') {
  return new LTCDecoder(sampleRate, frameRate, format)
}
exports.createDecoder = createDecoder

function writeBuffer (decoder, buffer) {
  decoder.write(buffer)
}
exports.writeBuffer = writeBuffer

function decodeFrames (decoder) {
  return decoder.read()
}
exports.decodeFrames = decodeFrames
