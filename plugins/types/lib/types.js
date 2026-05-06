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

const REFERENCE_TARGET_TYPE = {
  itemById: 0,
  selection: 1
}
exports.REFERENCE_TARGET_TYPE = REFERENCE_TARGET_TYPE

async function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.types.reference',
    name: 'Reference',
    inherits: 'bridge.types.delayable',
    properties: {
      name: {
        default: 'Reference'
      },
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
      targetType: {
        name: 'Target type',
        type: 'enum',
        enum: ['Item by id', 'Selection (main client)'],
        default: String(REFERENCE_TARGET_TYPE.itemById),
        'ui.group': 'Reference'
      },
      targetId: {
        name: 'Target',
        type: 'string',
        'ui.group': 'Reference',
        'ui.readable': true,
        'ui.glyph': '\uE903',
        'ui.dependsOn': [['targetType', String(REFERENCE_TARGET_TYPE.itemById)]]
      },
      targetButton: {
        name: '',
        type: 'string',
        'ui.group': 'Reference',
        'ui.uri': `${htmlPath}?path=inspector/reference/button`,
        'ui.dependsOn': [['targetType', String(REFERENCE_TARGET_TYPE.itemById)]]
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
        'ui.group': 'Timing',
        'ui.glyph': '#'
      },
      onPlay: {
        name: 'On play',
        type: 'enum',
        default: defaults?.onPlay || 0,
        enum: ['Do nothing', 'Play next sibling', 'Select next sibling (main client)'],
        'ui.group': 'Timing',
        'ui.width': '50%'
      },
      onEnd: {
        name: 'On end',
        type: 'enum',
        default: defaults?.onEnd || 0,
        enum: ['Do nothing', 'Play next sibling', 'Select next sibling (main client)', 'Stop'],
        'ui.group': 'Timing',
        'ui.width': '50%'
      }
    }
  })
}
exports.init = init
