// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  host: String,
 *  port: Number
 * }} ConnectionDescription
 *
 * @typedef {{
 *  id: String?,
 *  name: String,
 *  host: String,
 *  port: Number
 * }} ServerDescription
 */

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')
const assets = require('../../assets.json')
const manifest = require('./package.json')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimecodePlugin' })

const audio = require('./lib/audio')
const ltc = require('./lib/ltc')

require('./lib/commands')

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Caspar</title>
        <base href="/" />
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
        <script>
          window.PLUGIN = ${JSON.stringify(
            {
              name: manifest.name
            }
          )}
        </script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
  return await bridge.server.serveString(html)
}

function zeroPad (n) {
  if (n < 10) {
    return `0${n}`
  }
  return `${n}`
}

function formatTimecodeFrame (frame) {
  return `${zeroPad(frame.hours)}:${zeroPad(frame.minutes)}:${zeroPad(frame.seconds)}.${zeroPad(frame.frames)}`
}

/*
Activate the plugin and
bootstrap its contributions
*/
exports.activate = async () => {
  logger.debug('Activating timecode plugin')
  const htmlPath = await initWidget()

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.timecode.smpte',
    name: 'SMPTE display',
    uri: `${htmlPath}?path=widget/smpte`,
    description: 'Display incoming SMPTE timecode',
    supportsFloat: true
  })

  /*
  1. Find device
  */
  const devices = await audio.enumerateInputDevices()
  logger.debug('Devices', devices)
  const device = devices.find(device => device.label.includes('LTC'))
  if (!device) {
    logger.warn('No audio device found')
    return
  }

  logger.debug('Using device', device.label)

  const SAMPLE_RATE = 48000
  const FRAME_RATE = 25

  /*
  2. Setup context and read buffers
  */
  const ctx = await audio.createContext({
    sampleRate: SAMPLE_RATE,
    latencyHint: 'interactive'
  })

  const source = await audio.createDeviceStreamSource(ctx, device.deviceId)

  const decoder = ltc.createDecoder(SAMPLE_RATE, FRAME_RATE, 'float')

  const proc = await audio.createLTCDecoder(ctx, decoder.apv)
  proc.port.on('message', e => {
    const buf = Buffer.from(e?.buffer.buffer)
    decoder.write(buf)

    let frame = decoder.read()
    while (frame) {
      logger.debug('Frame', frame)

      bridge.events.emit('timecode.ltc', [{
        days: frame.days,
        hours: frame.hours,
        minutes: frame.minutes,
        seconds: frame.seconds,
        frames: frame.frames,
        smpte: formatTimecodeFrame(frame)
      }])

      frame = decoder.read()
    }
  })

  source.connect(proc)
  proc.connect(ctx.destination)

  logger.debug(`Audio running at ${ctx.sampleRate}Hz`)
  logger.debug(`Base Latency: ${ctx.baseLatency}s`)
}
