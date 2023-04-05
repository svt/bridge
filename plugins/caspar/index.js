// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')
const manifest = require('./package.json')

/**
 * Initiate the default settings
 * if no settings are set
 */
async function initSettings () {
  if (await bridge.state.get(`plugins.${manifest.name}.settings`) !== undefined) {
    return
  }

  bridge.state.apply({
    plugins: {
      [manifest.name]: {
        settings: {
          servers: []
        }
      }
    }
  })
}

exports.activate = async () => {
  console.log('Activating caspar plugin')
  initSettings()

  bridge.events.on('play', e => {
    console.log('Caspar playing', e)
  })
}
