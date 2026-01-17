// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const manifest = require('./package.json')
const assets = require('../../assets.json')
const audio = require('./lib/audio')

const DIController = require('./lib/DIController')

// eslint-disable-next-line
const LTCDevice = require('./lib/ltc/LTCDevice')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimecodePlugin' })

/**
 * Keep an index of all currently
 * running LTC devices
 * @type { Object.<string, LTCDevice> }
 */
const LTC_DEVICES = {}

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

async function makeInputSetting (inputs = []) {
  return {
    group: 'Timecode',
    title: 'Input list test title',
    inputs: [
      {
        type: 'list',
        label: 'List label',
        bind: 'shared.plugins.bridge-plugin-timecode.settings.ltc_inputs',
        settings: [
          {
            inputs: [
              {
                type: 'string',
                label: 'Name',
                bind: 'name'
              },
              {
                type: 'select',
                label: 'Audio device',
                bind: 'deviceId',
                options: {
                  $replace: [
                    {
                      id: 'none',
                      label: 'None'
                    },
                    ...inputs
                  ]
                }
              },
              {
                type: 'boolean',
                label: 'Active',
                bind: 'active',
                default: true
              }
            ]
          }
        ]
      }
    ]
  }
}

async function getAllAudioInputs () {
  return (await audio.enumerateInputDevices())
    .map(device => ({
      id: device?.deviceId,
      label: device?.label || 'Unnamed device'
    }))
}

function ltcDeviceFactory (deviceId) {
  const device = DIController.instantiate('LTCDevice', {}, {
    deviceId
  })
  device.start()
  return device
}

function syncDevicesWithSpecifiedInputs (inputs = []) {
  for (const input of inputs) {
    /*
    Handle newly added devices
    */
    if (!LTC_DEVICES[input.id] && input?.deviceId) {
      LTC_DEVICES[input.id] = ltcDeviceFactory(input?.deviceId)
      logger.debug('Created LTC device', input.id)
      continue
    }

    const device = LTC_DEVICES[input.id]

    /*
    Handle updated devices
    */
    if (device && !device?.compareTo(input)) {
      device.close()
      if (input?.deviceId) {
        LTC_DEVICES[input.id] = ltcDeviceFactory(input?.deviceId)
        logger.debug('Updated LTC device', input.id)
      }
      continue
    }
  }

  /*
  Close and remove devices that are no
  longer specified in settings
  */
  for (const deviceInputId of Object.keys(LTC_DEVICES)) {
    const inputExists = inputs.find(input => input?.id === deviceInputId)
    if (!inputExists) {
      LTC_DEVICES[deviceInputId].close()
      delete LTC_DEVICES[deviceInputId]
      logger.debug('Removed LTC device', deviceInputId)
    }
  }
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
  Update the list of available audio devices
  that's visible in settings
  */
  {
    const inputSetting = await makeInputSetting()
    const settingId = await bridge.settings.registerSetting(inputSetting)

    setInterval(async () => {
      const inputs = await getAllAudioInputs()
      const inputSetting = await makeInputSetting(inputs)
      bridge.settings.applySetting(settingId, inputSetting)
    }, 2000)
  }

  /*
  Update LTC devices whenever
  the settings change
  */
  bridge.events.on('state.change', (state, set) => {
    if (!set?.plugins?.[manifest?.name]?.settings?.ltc_inputs) {
      return
    }
    const inputs = state?.plugins?.[manifest?.name]?.settings?.ltc_inputs || []
    syncDevicesWithSpecifiedInputs(inputs)
  })

  /*
  Update LTC devices
  on startup
  */
  {
    const initialInputs = await bridge.state.get(`plugins.${manifest?.name}.settings.ltc_inputs`)
    if (initialInputs) {
      syncDevicesWithSpecifiedInputs(initialInputs)
    }
  }
}
