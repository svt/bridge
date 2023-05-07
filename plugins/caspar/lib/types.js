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
      'caspar.transition.type': {
        name: 'Transition',
        type: 'string',
        'ui.group': 'Transition'
      },
      'caspar.transition.duration': {
        name: 'Duration',
        type: 'string',
        'ui.group': 'Transition'
      },
      'caspar.transition.timing': {
        name: 'Timing function',
        type: 'string',
        'ui.group': 'Transition'
      }
    }
  })
}
