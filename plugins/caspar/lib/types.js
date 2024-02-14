// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.caspar.amcp',
    name: 'AMCP',
    category: 'Caspar',
    inherits: 'bridge.types.root',
    properties: {
      'caspar.server': {
        name: 'Server',
        type: 'string',
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
        'ui.group': 'Caspar',
        'ui.uri': `${htmlPath}?path=inspector/server`
      },
      'caspar.channel': {
        name: 'Channel',
        type: 'string',
        default: '1',
        allowsVariables: true,
        'ui.group': 'Caspar',
        'ui.width': '50%'
      },
      'caspar.layer': {
        name: 'Layer',
        type: 'string',
        default: '1',
        allowsVariables: true,
        'ui.group': 'Caspar',
        'ui.width': '50%'
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
        enum: ['Cut', 'Mix', 'Push', 'Slide', 'Wipe'],
        'ui.group': 'Transition'
      },
      'caspar.transitionDirection': {
        name: 'Direction',
        type: 'enum',
        enum: ['Left', 'Right'],
        default: 'Left',
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
      'caspar.templateData': {
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
}
exports.init = init
