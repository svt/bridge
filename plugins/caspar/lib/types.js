const bridge = require('bridge')
console.log('BRIDGE', bridge)

function init (htmlPath) {
  initMedia(htmlPath)
}
exports.init = init

function initMedia (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.caspar.media',
    name: 'Media',
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
        'ui.group': 'Caspar',
        'ui.width': '50%'
      },
      'caspar.layer': {
        name: 'Layer',
        type: 'string',
        default: '1',
        'ui.group': 'Caspar',
        'ui.width': '50%'
      },
      'caspar.target': {
        name: 'Target',
        type: 'string',
        'ui.group': 'Caspar'
      },
      'caspar.transitionName': {
        name: 'Transition',
        type: 'enum',
        enum: ['Cut', 'Mix', 'Push', 'Slide', 'Wipe'],
        'ui.group': 'Transition'
      },
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
}
