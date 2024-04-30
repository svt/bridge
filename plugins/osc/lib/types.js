// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.osc.trigger',
    name: 'Trigger',
    category: 'OSC',
    inherits: 'bridge.types.delayable',
    properties: {
      'osc.target': {
        name: 'Target',
        type: 'string',
        'ui.group': 'OSC',
        'ui.uri': `${htmlPath}?path=inspector/target`
      },
      'osc.address': {
        name: 'Address',
        type: 'string',
        'ui.group': 'OSC'
      },
      'osc.type': {
        name: 'Type',
        type: 'enum',
        enum: [
          'String',
          'Integer',
          'Float',
          'Boolean'
        ],
        default: '0',
        'ui.group': 'OSC'
      },
      'osc.value': {
        name: 'Value',
        type: 'string',
        'ui.group': 'OSC'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.osc.udp.activate',
    name: 'Activate UDP server',
    category: 'OSC',
    inherits: 'bridge.types.delayable',
    properties: {
      'osc.active': {
        name: 'Activate server',
        type: 'boolean',
        'ui.group': 'OSC'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.osc.tcp.activate',
    name: 'Activate TCP server',
    category: 'OSC',
    inherits: 'bridge.types.delayable',
    properties: {
      'osc.active': {
        name: 'Activate server',
        type: 'boolean',
        'ui.group': 'OSC'
      }
    }
  })
}
exports.init = init
