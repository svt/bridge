// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

const pkg = require('../package.json')

const REFERENCE_ACTION = {
  play: 0,
  stop: 1,
  none: 2
}
exports.REFERENCE_ACTION = REFERENCE_ACTION

async function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.types.reference',
    name: 'Reference',
    inherits: 'bridge.types.delayable',
    properties: {
      playAction: {
        name: 'Play action',
        type: 'enum',
        enum: ['Play', 'Stop', 'None'],
        default: REFERENCE_ACTION.play,
        'ui.group': 'Reference'
      },
      stopAction: {
        name: 'Stop action',
        type: 'enum',
        enum: ['Play', 'Stop', 'None'],
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

  const defaults = await bridge.state.get(`plugins.${pkg.name}.settings.defaults`)
  bridge.types.registerType({
    id: 'bridge.types.playable',
    inherits: 'bridge.types.root',
    properties: {
      tag: {
        name: 'Tag',
        type: 'string',
        'ui.group': 'Timing'
      },
      onPlay: {
        name: 'On play',
        type: 'enum',
        default: defaults?.onPlay || 0,
        enum: ['Do nothing', 'Play next sibling', 'Select next sibling (main client)'],
        'ui.group': 'Timing'
      },
      onEnd: {
        name: 'On end',
        type: 'enum',
        default: defaults?.onEnd || 0,
        enum: ['Do nothing', 'Play next sibling', 'Select next sibling (main client)'],
        'ui.group': 'Timing'
      }
    }
  })
}
exports.init = init
