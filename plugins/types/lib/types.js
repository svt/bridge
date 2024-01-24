// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

function init (htmlPath) {
  bridge.types.registerType({
    id: 'bridge.types.reference',
    name: 'Reference',
    inherits: 'bridge.types.delayable',
    properties: {
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
