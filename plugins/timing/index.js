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
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const assets = require('../../assets.json')
const manifest = require('./package.json')

const Logger = require('../../lib/Logger')
const logger = new Logger({ name: 'TimingPlugin' })

const Cache = require('./lib/Cache')
const cache = new Cache()

const Timer = require('./lib/Timer')

let localState = {}

/**
 * @type { Map.<String, Timer> }
 */
const TIMERS = new Map()

const TYPE_ORDER = ['prewait', 'duration', 'postwait']

const FRAMERATE_OPTIONS = ['15', '23.97', '24', '25', '30', '48', '50', '60', '100', '120', '200', '240']
const DEFAULT_FRAMERATE = '50'

/*
{
  state: 'paused',
  total: 2000,
  remaining: 1000,
  start: Date.now(),
  type: 'prewait'
}
*/

function setupItem (item) {
  for (const type of TYPE_ORDER) {
    const value = item?.data?.timing?.[type]
    if (value != null && value > 0) {
      TIMERS.set(item.id, [type, new Timer(value), () => console.log('Action for item', item.id)])
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
      { "type": "select", "options": FRAMERATE_OPTIONS, "bind": "shared.plugins.bridge-plugin-timing.settings.framerate" }
    ]
  })

  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          framerate: FRAMERATE_OPTIONS.indexOf(DEFAULT_FRAMERATE)
        }
      }
    }
  })
}

async function initWidget () {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>State</title>
        <base href="/"></base>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${cssPath}" />
        <script src="${jsPath}" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `

  const htmlPath = await bridge.server.serveString(html)
  bridge.widgets.registerWidget({
    id: 'bridge.plugins.timing',
    name: 'Timing',
    uri: `${htmlPath}`,
    description: 'View the currently playing items'
  })
}

function getFramerate () {
  return Promise.resolve(50)
}

/**
 * Initialize the main tick-loop
 * MUST only be called ONCE
 */
async function initLoop () {
  const framerate = await getFramerate()

  const id = setInterval(async () => {
    tick()

    /*
    Check if the project framerate has changed, if so,
    cancel the current loop and start a new one
    */
    const newFramerate = await getFramerate()
    if (newFramerate !== framerate) {
      clearInterval(id)
      initLoop()
    }
  }, 1000 / framerate)
}

/**
 * Perform a tick
 * on all timers,
 * 
 * this function performs two tasks:
 * 
 * 1. Tick all the timers and update the plugin's internal record
 *
 * 2. Check if any changes has occured to the shared state
 *    and if so, update it for the UI to reflect
 * 
 * The reason for separating the state into one internal and one shared is to prevent the
 * shared state to be updated on every frame tick, which would be expensive
 */
async function tick () {
  /*
  1. TICK TIMERS
  */
  for (const [id, [type, timer, action]] of TIMERS) {
    const isFinished = timer.tick()

    if (isFinished) {
      TIMERS.delete(id)
      action()
    }
  }

  /*
  2. DIFF AND UPDATE SHARED STATE
  */
  const state = localState?._tmp?.[manifest.name]?.items
  const snapshot = JSON.stringify(state || [])
  const currentTimers = Array.from(TIMERS.entries())
    .map(([id, [type, timer]]) => [id, [type, ...timer.serialize()]])

  /*
  Skip updating the state
  if it hasn't changed
  */
  if (snapshot === JSON.stringify(currentTimers)) {
    return
  }

  if (state === undefined) {
    bridge.state.apply({
      _tmp: {
        [manifest.name]: {
          items: currentTimers
        }
      }
    })
  } else {
    bridge.state.apply({
      _tmp: {
        [manifest.name]: {
          items: { $replace: currentTimers }
        }
      }
    })
  }
}

exports.activate = async () => {
  initSettings()
  initWidget()
  initLoop()

  bridge.events.on('state.change', newState => localState = newState)

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
