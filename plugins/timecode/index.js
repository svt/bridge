// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const manifest = require('./package.json')
const audio = require('./lib/audio')

const DIController = require('./lib/DIController')

const LTCDecoder = require('./lib/ltc/LTCDecoder')
// eslint-disable-next-line
const LTCDevice = require('./lib/ltc/LTCDevice')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimecodePlugin' })

const NO_AUDIO_DEVICE_ID = 'none'

/**
 * Keep an index of all currently
 * running LTC devices
 * @type { Object.<string, LTCDevice> }
 */
const LTC_DEVICES = {}

async function makeInputSetting (inputs = [], replaceInputs) {
  const noInput = {
    id: NO_AUDIO_DEVICE_ID,
    label: 'None'
  }

  let _inputs = [noInput, ...inputs]
  if (replaceInputs) {
    _inputs = {
      $replace: _inputs
    }
  }

  return {
    group: 'Timecode',
    title: 'LTC devices',
    inputs: [
      {
        type: 'list',
        label: '',
        bind: 'shared.plugins.bridge-plugin-timecode.settings.ltc_devices',
        settings: [
          {
            title: 'Name',
            inputs: [
              {
                type: 'string',
                bind: 'name',
                placeholder: 'Name'
              }
            ]
          },
          {
            title: 'Audio device',
            inputs: [
              {
                type: 'select',
                bind: 'deviceId',
                options: _inputs
              }
            ]
          },
          {
            title: 'Frame rate',
            inputs: [
              {
                type: 'segmented',
                bind: 'frameRateIndex',
                segments: LTCDecoder.SUPPORTED_FRAME_RATES
              }
            ]
          }
        ]
      }
    ]
  }
}

async function registerClockForInput (inputId, label) {
  if (typeof inputId !== 'string') {
    throw new Error('Missing or invalid input id, must be a string')
  }

  const clockAlreadyExistsForInput = await getClockIdForInput(inputId)
  if (clockAlreadyExistsForInput) {
    return
  }

  const clockId = await bridge.time.registerClock({
    label
  })

  bridge.state.apply(`plugins.${manifest.name}.clocks`, {
    [inputId]: clockId
  })

  return clockId
}

function getClockIdForInput (inputId) {
  return bridge.state.get(`plugins.${manifest.name}.clocks.${inputId}`)
}

async function removeClock (inputId, clockId) {
  if (!clockId) {
    return
  }
  await bridge.time.removeClock(clockId)
  await bridge.state.apply(`plugins.${manifest.name}.clocks`, {
    [inputId]: { $delete: true }
  })
}

async function getAllAudioInputs () {
  return (await audio.enumerateInputDevices())
    .map(device => ({
      id: device?.deviceId,
      label: device?.label || 'Unnamed device'
    }))
}

async function getAudioDeviceWithId (deviceId) {
  const devices = await getAllAudioInputs()
  return devices.find(device => device.id === deviceId)
}

function ltcDeviceFactory (deviceId, frameRate = LTCDecoder.DEFAULT_FRAME_RATE_HZ, onFrame = () => {}) {
  const device = DIController.instantiate('LTCDevice', {
    LTCDecoder: DIController.instantiate('LTCDecoder', {},
      LTCDecoder.DEFAULT_SAMPLE_RATE_HZ,
      frameRate,
      LTCDecoder.DEFAULT_AUDIO_FORMAT
    )
  }, {
    deviceId
  }, onFrame)
  device.start()
  return device
}

async function onLTCDeviceCreated (newSpec) {
  /*
  Make sure the input has registered
  a clock in the Bridge API
  */
  let clockId = await getClockIdForInput(newSpec?.id)
  if (!clockId) {
    clockId = await registerClockForInput(newSpec?.id, newSpec?.name)
  }

  /*
  Set up a new LTC device if there is already a specified device id,
  this will be triggered if the workspace is loaded from disk and the
  device has already been specified
  */
  let device
  if (newSpec?.deviceId) {
    /*
    Check if the device exists on this host as the project
    file might have been loaded from another host
    */
    const deviceExists = await getAudioDeviceWithId(newSpec.deviceId)

    const frameRate = LTCDecoder.SUPPORTED_FRAME_RATES[newSpec?.frameRateIndex || 0]

    if (deviceExists) {
      logger.debug('Setting upp new LTC device')
      device = ltcDeviceFactory(newSpec?.deviceId, frameRate, frame => {
        bridge.time.submitFrame(clockId, frame)
      })
    }
  }

  LTC_DEVICES[newSpec?.id] = {
    clockId,
    device
  }
}

async function onLTCDeviceChanged (newSpec) {
  if (!LTC_DEVICES[newSpec?.id]) {
    return
  }

  const device = LTC_DEVICES[newSpec?.id]?.device
  const frameRate = LTCDecoder.SUPPORTED_FRAME_RATES[newSpec?.frameRateIndex || 0]

  /*
  Close and remove the current ltc
  device if it is to be replaced
  */
  if (device && !device?.compareTo({ ...newSpec, frameRate })) {
    await device.close()
    LTC_DEVICES[newSpec?.id].device = undefined
  }

  /*
  Create a new ltc device if none exists
  and the spec isn't set to "no device"
  */
  if (
    !LTC_DEVICES[newSpec?.id]?.device &&
    newSpec?.deviceId &&
    newSpec?.deviceId !== NO_AUDIO_DEVICE_ID &&
    newSpec?.clockId
  ) {
    logger.debug('Setting up new LTC device')
    LTC_DEVICES[newSpec?.id].device = ltcDeviceFactory(newSpec?.deviceId, newSpec?.frameRate, frame => {
      bridge.time.submitFrame(newSpec.clockId, frame)
    })
  }

  /*
  Update the label of the clock feed
  */
  const clockId = LTC_DEVICES[newSpec?.id]?.clockId
  if (clockId) {
    await bridge.time.applyClock(clockId, {
      label: newSpec?.name
    })
  }
}

async function onLTCDeviceRemoved (deviceId) {
  const spec = LTC_DEVICES[deviceId]

  if (spec?.device) {
    spec.device?.close()
  }

  if (spec?.clockId) {
    await removeClock(spec?.id, spec?.clockId)
  }

  delete LTC_DEVICES[deviceId]
  logger.debug('Removed LTC device', deviceId)
}

async function updateDevicesFromSettings (inputs = []) {
  for (const input of inputs) {
    if (!LTC_DEVICES[input.id]) {
      await onLTCDeviceCreated(input)
    } else {
      await onLTCDeviceChanged(input)
    }
  }

  /*
  Close and remove devices that are no
  longer specified in settings
  */
  for (const deviceInputId of Object.keys(LTC_DEVICES)) {
    const inputExists = inputs.find(input => input?.id === deviceInputId)
    if (!inputExists) {
      await onLTCDeviceRemoved(deviceInputId)
    }
  }
}

/*
Activate the plugin and
bootstrap its contributions
*/
exports.activate = async () => {
  logger.debug('Activating timecode plugin')

  /*
  Update the list of available audio devices
  that's visible in settings
  */
  {
    const inputs = await getAllAudioInputs()
    const inputSetting = await makeInputSetting(inputs)
    const settingId = await bridge.settings.registerSetting(inputSetting)

    setInterval(async () => {
      const inputs = await getAllAudioInputs()
      const inputSetting = await makeInputSetting(inputs, true)
      bridge.settings.applySetting(settingId, inputSetting)
    }, 2000)
  }

  /*
  Update LTC devices whenever
  the settings change
  */
  bridge.events.on('state.change', (state, set) => {
    if (!set?.plugins?.[manifest?.name]?.settings?.ltc_devices) {
      return
    }
    const inputs = state?.plugins?.[manifest?.name]?.settings?.ltc_devices || []
    updateDevicesFromSettings(inputs)
  })

  /*
  Update LTC devices
  on startup
  */
  {
    const initialInputs = await bridge.state.get(`plugins.${manifest?.name}.settings.ltc_devices`)
    if (initialInputs) {
      updateDevicesFromSettings(initialInputs)
    }
  }
}
