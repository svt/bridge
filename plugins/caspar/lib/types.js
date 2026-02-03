// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

const TRANSITION_NAME_ENUM = ['Cut', 'Mix', 'Push', 'Slide', 'Wipe']
exports.TRANSITION_NAME_ENUM = TRANSITION_NAME_ENUM

const TRANSITION_DIRECTION_ENUM = ['Left', 'Right']
exports.TRANSITION_DIRECTION_ENUM = TRANSITION_DIRECTION_ENUM

const SCALE_MODE_ENUM = ['Stretch', 'Fit', 'Fill', 'Original', 'HFILL', 'VFILL']
exports.SCALE_MODE_ENUM = SCALE_MODE_ENUM

const DEFAULT_SERVER_ID = 'group:0'

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.caspar.amcp',
    name: 'AMCP',
    category: 'Caspar',
    inherits: 'bridge.types.playable',
    properties: {
      name: {
        default: 'AMCP'
      },
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
    id: 'bridge.caspar.mixableWithTransitions',
    /*
    Inherit from playable rather than mixable and
    redefine the transition params to get them in
    the correct order
    */
    inherits: 'bridge.caspar.playable',
    properties: {
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
      'caspar.scaleMode': {
        name: 'Scale mode',
        type: 'enum',
        enum: SCALE_MODE_ENUM,
        default: '0',
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
      name: {
        default: 'Load'
      },
      'caspar.auto': {
        name: 'Auto play',
        type: 'boolean',
        default: false,
        'ui.group': 'Timing'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.image-scroller',
    name: 'Image scroller',
    category: 'Caspar',
    inherits: 'bridge.caspar.playable',
    properties: {
      'caspar.target': {
        name: 'Target',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      },
      'caspar.speed': {
        name: 'Speed',
        type: 'string',
        default: '7',
        allowsVariables: true,
        'ui.group': 'Image scroller'
      },
      'caspar.blur': {
        name: 'Blur',
        type: 'string',
        default: '0',
        allowsVariables: true,
        'ui.group': 'Image scroller'
      },
      'caspar.progressive': {
        name: 'Progressive',
        type: 'boolean',
        default: false,
        'ui.group': 'Image scroller'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.template',
    name: 'Template',
    category: 'Caspar',
    inherits: 'bridge.caspar.playable',
    properties: {
      name: {
        default: 'Template: $(this.data.caspar.data.f0)'
      },
      'caspar.target': {
        name: 'Target',
        type: 'string',
        allowsVariables: true,
        'ui.group': 'Caspar'
      },
      'caspar.data': {
        default: { f0: 'Foo' }
      },
      'caspar.templateDataSource': {
        name: 'Data',
        type: 'string',
        default: '{\n  "f0": "Foo"\n}',
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
    inherits: 'bridge.caspar.template',
    properties: {
      name: {
        default: 'Template update: $(this.data.caspar.data.f0)'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.html',
    name: 'HTML page',
    category: 'Caspar',
    inherits: 'bridge.caspar.mixableWithTransitions',
    properties: {
      name: {
        default: 'HTML page: $(this.data.caspar.url)'
      },
      'caspar.url': {
        name: 'URL',
        type: 'string',
        default: 'https://',
        allowsVariables: true,
        'ui.group': 'Caspar'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.clear',
    name: 'Clear',
    category: 'Caspar',
    inherits: 'bridge.caspar.playable',
    properties: {
      name: {
        default: 'Clear'
      }
    }
  })

  bridge.types.registerType({
    id: 'bridge.caspar.opacity',
    name: 'Opacity',
    category: 'Caspar',
    inherits: 'bridge.caspar.mixable',
    properties: {
      name: {
        default: 'Opacity'
      },
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
      name: {
        default: 'Transform'
      },
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
      name: {
        default: 'Volume'
      },
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
