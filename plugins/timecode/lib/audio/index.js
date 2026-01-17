const { mediaDevices } = require('node-web-audio-api')

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
