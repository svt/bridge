// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

const TRANSITION_NAME_ENUM = ['Cut', 'Mix', 'Push', 'Slide', 'Wipe']
exports.TRANSITION_NAME_ENUM = TRANSITION_NAME_ENUM

const TRANSITION_DIRECTION_ENUM = ['Left', 'Right']
exports.TRANSITION_DIRECTION_ENUM = TRANSITION_DIRECTION_ENUM

const DEFAULT_SERVER_ID = 'group:0'

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.caspar.amcp',
    name: 'AMCP',
    category: 'Caspar',
    inherits: 'bridge.types.playable',
    properties: {
      'caspar.server': {
        name: 'Server',
        type: 'string',
        default: DEFAULT_SERVER_ID,
        'ui.group': 'Caspar',
        'ui.uri': `${htmlPath}?path=inspector/server`
      },
      'caspar.amcp': {
        name: 'Command',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.playable',
    inherits: 'bridge.types.media',
    properties: {
      'caspar.server': {
        name: 'Server',
        type: 'string',
        default: DEFAULT_SERVER_ID,
        'ui.group': 'Caspar',
        'ui.uri': `${htmlPath}?path=inspector/server`
      },
      'caspar.channel': {
        name: 'Channel',
        type: 'string',
        default: '1',
        allowsVariables: true,
        'ui.group': 'Caspar',
        'ui.width': '50%',
        'ui.readable': true
      },
      'caspar.layer': {
        name: 'Layer',
        type: 'string',
        default: '1',
        allowsVariables: true,
        'ui.group': 'Caspar',
        'ui.width': '50%',
        'ui.readable': true
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.mixable',
    inherits: 'bridge.caspar.playable',
    properties: {
      'caspar.transitionDuration': {
        name: 'Duration',
        type: 'string',
        default: '0',
        'ui.group': 'Transition',
        'ui.unit': 'frames'
      },
      'caspar.transitionEasing': {
        name: 'Easing',
        type: 'string',
        'ui.group': 'Transition',
        'ui.uri': `${htmlPath}?path=inspector/transition`
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.media',
    name: 'Media',
    category: 'Caspar',
    /*
    Inherit from playable rather than mixable and
    redefine the transition params to get them in
    the correct order
    */
    inherits: 'bridge.caspar.playable',
    properties: {
      'caspar.target': {
        name: 'Target',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      },
      'caspar.loop': {
        name: 'Loop',
        type: 'boolean',
        'ui.group': 'Timing'
      },
      'caspar.transitionName': {
        name: 'Transition',
        type: 'enum',
        enum: TRANSITION_NAME_ENUM,
        default: '0',
        'ui.group': 'Transition'
      },
      'caspar.transitionDirection': {
        name: 'Direction',
        type: 'enum',
        enum: TRANSITION_DIRECTION_ENUM,
        default: '0',
        'ui.group': 'Transition'
      },
      'caspar.transitionDuration': {
        name: 'Duration',
        type: 'string',
        default: '0',
        allowsVariables: true,
        'ui.group': 'Transition',
        'ui.unit': 'frames'
      },
      'caspar.transitionEasing': {
        name: 'Easing',
        type: 'string',
        'ui.group': 'Transition',
        'ui.uri': `${htmlPath}?path=inspector/transition`
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.load',
    name: 'Load',
    category: 'Caspar',
    inherits: 'bridge.caspar.media',
    properties: {
      'caspar.auto': {
        name: 'Auto play',
        type: 'boolean',
        default: false,
        'ui.group': 'Timing'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.template',
    name: 'Template',
    category: 'Caspar',
    inherits: 'bridge.caspar.playable',
    properties: {
      'caspar.target': {
        name: 'Target',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      },
      'caspar.templateDataSource': {
        name: 'Data',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar',
        'ui.uri': `${htmlPath}?path=inspector/template`
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.template.update',
    name: 'Template update',
    category: 'Caspar',
    inherits: 'bridge.caspar.template'
  })

  bridge.types.registerType({
    id: 'bridge.caspar.clear',
    name: 'Clear',
    category: 'Caspar',
    inherits: 'bridge.caspar.playable',
    properties: {}
  })

  bridge.types.registerType({
    id: 'bridge.caspar.opacity',
    name: 'Opacity',
    category: 'Caspar',
    inherits: 'bridge.caspar.mixable',
    properties: {
      'caspar.opacity': {
        name: 'Opacity',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.transform',
    name: 'Transform',
    category: 'Caspar',
    inherits: 'bridge.caspar.mixable',
    properties: {
      'caspar.x': {
        name: 'X',
        type: 'string',
        allowsVariables: true,
        'ui.unit': 'px',
        'ui.group': 'Caspar'
      },
      'caspar.y': {
        name: 'Y',
        type: 'string',
        allowsVariables: true,
        'ui.unit': 'px',
        'ui.group': 'Caspar'
      },
      'caspar.width': {
        name: 'Width',
        type: 'string',
        allowsVariables: true,
        'ui.unit': 'px',
        'ui.group': 'Caspar'
      },
      'caspar.height': {
        name: 'Height',
        type: 'string',
        allowsVariables: true,
        'ui.unit': 'px',
        'ui.group': 'Caspar'
      }
    }
  })
  
  bridge.types.registerType({
    id: 'bridge.caspar.volume',
    name: 'Volume',
    category: 'Caspar',
    inherits: 'bridge.caspar.mixable',
    properties: {
      'caspar.volume': {
        name: 'Volume',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      }
    }
  })
}
exports.init = init
