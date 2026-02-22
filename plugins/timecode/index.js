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

require('./lib/Interval')

const LTCDecoder = require('./lib/ltc/LTCDecoder')
// eslint-disable-next-line
const LTCDevice = require('./lib/ltc/LTCDevice')

const TimecodeDevice = require('./lib/TimecodeDevice')
const TimecodeFrame = require('./lib/TimecodeFrame')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimecodePlugin' })

const Cache = require('./lib/Cache')
const cache = new Cache()

const NO_AUDIO_DEVICE_ID = 'none'
const TIMECODE_TRIGGER_TYPE = 'bridge.timecode.trigger'

const TRIGGER_CUES_CACHE_TTL_MS = 100

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
        label: 'Manage LTC devices used for parsing incoming SMPTE timecode',
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
          },
          {
            title: 'Free run',
            inputs: [
              {
                type: 'select',
                bind: 'freeRunFrames',
                options: [
                  {
                    id: 0,
                    label: 'None'
                  },
                  {
                    id: 2,
                    label: '2 frames'
                  },
                  {
                    id: 5,
                    label: '5 frames'
                  },
                  {
                    id: 10,
                    label: '10 frames'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
}

function makeRescanSetting (isLoading) {
  return {
    group: 'Timecode',
    title: 'Audio devices',
    inputs: [
      {
        type: 'button',
        label: 'Rescan for audio devices connected to the Bridge host',
        buttonText: 'Rescan',
        buttonIsLoading: isLoading,
        command: 'timecode.rescanAudioDevices'
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

function getClockIdForInputLocal (inputId) {
  const localState = bridge.state.getLocalState()
  return localState?.plugins?.[manifest.name]?.clocks?.[inputId]
}

async function removeClock (inputId, clockId) {
  /*
  Remove the reference to the
  clock stored by this plugin
  */
  if (inputId) {
    await bridge.state.apply(`plugins.${manifest.name}.clocks`, {
      [inputId]: { $delete: true }
    })
  }

  /*
  Remove the actual clock
  from the time api
  */
  if (clockId) {
    await bridge.time.removeClock(clockId)
  }
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

function findTriggerCues (clockId) {
  const items = bridge.state.getLocalState()?.items
  const types = bridge.state.getLocalState()?._types
  const typeIsTimecodeTriggerDict = {}

  if (typeof items !== 'object' || typeof types !== 'object') {
    return
  }

  return Object.entries(items)
    .map(([id, item]) => {
      if (Object.prototype.hasOwnProperty.call(typeIsTimecodeTriggerDict, item.type)) {
        return [id, item, typeIsTimecodeTriggerDict[item.type]]
      }

      const renderedType = bridge.types.renderType(item.type, types)
      typeIsTimecodeTriggerDict[item.type] = item.type === TIMECODE_TRIGGER_TYPE || renderedType?.ancestors?.includes(TIMECODE_TRIGGER_TYPE)
      return [id, item, typeIsTimecodeTriggerDict[item.type]]
    })
    .filter(([,, typeIsTimecodeTrigger]) => {
      return typeIsTimecodeTrigger
    })
    /*
    Filter to return only the
    cues for the selected input
    */
    .filter(([, item]) => {
      const _clockId = getClockIdForInputLocal(item?.data?.timecode?.input)
      return _clockId === clockId
    })
    .map(([, item]) => item)
}

function triggerCues (clockId, frame) {
  const cues = cache.cache(`triggers:${clockId}`, () => findTriggerCues(clockId), TRIGGER_CUES_CACHE_TTL_MS)
  if (!Array.isArray(cues)) {
    return
  }

  for (const cue of cues) {
    const cueFrame = TimecodeFrame.fromSMPTE(cue?.data?.timecode?.smpte)
    if (!cueFrame) {
      continue
    }

    if (TimecodeFrame.compare(frame, cueFrame)) {
      bridge.items.playItem(cue.id)
    }
  }
}

function submitFrameForClock (clockId, frame) {
  triggerCues(clockId, frame)
  bridge.time.submitFrame(clockId, frame)
}

function ltcDeviceFactory (deviceId, frameRate = LTCDecoder.DEFAULT_FRAME_RATE_HZ, freeRunFrames = TimecodeDevice.DEFAULT_FREE_RUN_FRAME_COUNT, onFrame = () => {}) {
  const device = DIController.instantiate('LTCDevice', {
    LTCDecoder: DIController.instantiate('LTCDecoder', {},
      LTCDecoder.DEFAULT_SAMPLE_RATE_HZ,
      frameRate,
      LTCDecoder.DEFAULT_AUDIO_FORMAT
    )
  }, {
    deviceId,
    freeRunFrames
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
      device = ltcDeviceFactory(newSpec?.deviceId, frameRate, newSpec?.frameRateIndex, newSpec?.freeRunFrames, frame => {
        submitFrameForClock(clockId, frame)
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
  const clockId = LTC_DEVICES[newSpec?.id]?.clockId
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
    clockId
  ) {
    LTC_DEVICES[newSpec?.id].device = ltcDeviceFactory(newSpec?.deviceId, newSpec?.frameRate, newSpec?.freeRunFrames, frame => {
      submitFrameForClock(clockId, frame)
    })
  }

  /*
  Update the label of the clock feed
  */
  if (clockId) {
    await bridge.time.applyClock(clockId, {
      label: newSpec?.name
    })
  }
}

async function onLTCDeviceRemoved (inputId) {
  const spec = LTC_DEVICES[inputId]

  if (spec?.device) {
    spec.device?.close()
  }

  await removeClock(inputId, spec?.clockId)

  delete LTC_DEVICES[inputId]
  logger.debug('Removed LTC device', inputId)
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
    const rescanSetting = makeRescanSetting(false)
    const rescanSettingId = await bridge.settings.registerSetting(rescanSetting)
    const inputsSettingId = await bridge.settings.registerSetting(inputSetting)

    async function rescanAudioDevices () {
      /*
      Show a loading indicator
      next to the rescan button
      */
      const loadingRescanSetting = makeRescanSetting(true)
      bridge.settings.applySetting(rescanSettingId, loadingRescanSetting)

      const inputs = await getAllAudioInputs()
      const inputSetting = await makeInputSetting(inputs, true)

      /*
      Hide the loading indicator for the rescan
      setting and update the inputs setting
      */
      bridge.settings.applySetting(rescanSettingId, rescanSetting)
      bridge.settings.applySetting(inputsSettingId, inputSetting)
    }

    bridge.commands.registerCommand('timecode.rescanAudioDevices', rescanAudioDevices)
  }

  /*
  Update LTC devices whenever
  the settings change

  This listener is also important for
  the local state to stay updated,
  removing this will prevent findTriggerCues
  to work properly
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
