// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
    Pre-wait       Duration        Post-wait
   |--------|---------------------|---------|
   |        | Event: timing.start |         | Event: timing.end
   | Event: timing.prewait        |
   | Event: items.start           | Event: timing.postwait
*/

/**
 * @typedef {{
 *  state: String,
 *  total: Number,
 *  remaining: Number,
 *  start: Number,
 *  type: String
 * }} Timer
 *
 * @typedef {{
 *  state: String | undefined,
 *  total: Number,
 *  remaining: Number | undefined,
 *  type: String
 * }} TimerInit
 */

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')
const manifest = require('./package.json')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimingPlugin' })

const TIMERS = new Map()

const TYPE_ORDER = ['prewait', 'duration', 'postwait']

const FRAMERATES = ['15', '23.97', '24', '25', '30', '48', '50', 60]

/*
{
  state: 'paused',
  total: 2000,
  remaining: 1000,
  start: Date.now(),
  type: 'prewait'
}
*/

/**
 * Create a timer object
 * @param { String } itemId
 * @param { TimerInit } timerInit
 * @returns { Timer }
 */
function timerFactory (itemId, timerInit = {}) {
  return {
    state: timerInit?.state || 'running',
    total: timerInit?.total,
    remaining: timerInit?.remaining || timerInit?.total,
    start: Date.now(),
    type: timerInit?.type
  }
}

function setupItem (item) {
  for (const type of TYPE_ORDER) {
    const value = item?.data?.timing?.[type]
    if (value != null && value > 0) {
      TIMERS.add(item.id, timerFactory({
        type,
        total: value
      }))
      return
    }
  }
}

function teardownItem (itemId) {
  TIMERS.delete(itemId)
}

/**
 * Initiate the default settings
 * if no settings are set
 */
async function initSettings () {
  bridge.settings.registerSetting({
    "title": "Framerate",
    "group": "Timing",
    "description": "The framerate that this project uses, for accurate timing",
    "inputs": [
      { "type": "select", "options": FRAMERATES, "bind": "shared.plugins.bridge-plugin-timing.settings.framerate" }
    ]
  })

  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          framerate: FRAMERATES.indexOf('50')
        }
      }
    }
  })
}

exports.activate = async () => {
  logger.info('Activating timings plugin')

  initSettings()

  bridge.events.on('items.play', items => {
    for (const item of items) {
      teardownItem(item.id)
      setupItem(item)
    }
  })

  bridge.events.on('items.stop', items => {
    for (const item of items) {
      teardownItem(item.id)
    }
  })
}

exports.teardown = () => {

}
