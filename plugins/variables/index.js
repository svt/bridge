// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

exports.activate = async () => {
  bridge.events.on('play', item => {
    if (item.type !== 'bridge.variables.variable') {
      return
    }
    bridge.variables.setVariable(item.data.variable.key, item.data.variable.value)
  })
}
