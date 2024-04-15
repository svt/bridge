// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

const REFERENCE_ACTION = {
  play: 0,
  stop: 1
}
exports.REFERENCE_ACTION = REFERENCE_ACTION

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.types.reference',
    name: 'Reference',
    inherits: 'bridge.types.delayable',
    properties: {
      playAction: {
        name: 'Play action',
        type: 'enum',
        enum: ['Play', 'Stop'],
        default: REFERENCE_ACTION.play,
        'ui.group': 'Reference'
      },
      stopAction: {
        name: 'Stop action',
        type: 'enum',
        enum: ['Play', 'Stop'],
        default: REFERENCE_ACTION.stop,
        'ui.group': 'Reference'
      },
      targetId: {
        name: 'Target id',
        type: 'string',
        'ui.group': 'Reference'
      },
      targetButton: {
        name: '',
        type: 'string',
        'ui.group': 'Reference',
        'ui.uri': `${htmlPath}?path=inspector/reference/button`
      }
    }
  })
}
exports.init = init
