// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.atem.base',
    category: 'ATEM',
    inherits: 'bridge.types.delayable',
    properties: {
      'atem.device': {
        name: 'Device',
        type: 'string',
        'ui.group': 'ATEM'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.atem.trigger',
    name: 'Set PGM',
    category: 'ATEM',
    inherits: 'bridge.atem.base',
    properties: {
      'atem.source': {
        name: 'Source',
        type: 'string',
        'ui.group': 'ATEM'
      }
    }
  })
}
exports.init = init
