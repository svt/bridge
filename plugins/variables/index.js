// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

exports.activate = async () => {
  bridge.events.on('items.play', items => {
    for (const item of items) {
      if (item.type !== 'bridge.variables.variable') {
        return
      }
      bridge.variables.setVariable(item.data.variable.key, item.data.variable.value)
    }
  })
}
