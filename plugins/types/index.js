// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../api').Api }
 */
const bridge = require('bridge')

const GROUP_PLAY_MODES = {
  all: 'Trigger all children at once'
}

const PLAY_HANDLERS = {
  /*
  Trigger group children based
  on the group's play mode
  */
  'bridge.types.group': item => {
    if (item?.data?.playMode === GROUP_PLAY_MODES.all) {
      for (const child of item.children) {
        bridge.items.playItem(child)
      }
    }
  }
}

const STOP_HANDLERS = {
  /*
  Trigger group children based
  on the group's play mode
  */
  'bridge.types.group': item => {
    for (const child of item.children) {
      bridge.items.stopItem(child)
    }
  }
}

exports.activate = async () => {
  bridge.events.on('item.play', item => {
    PLAY_HANDLERS[item.type]?.(item)
  })

  bridge.events.on('item.stop', item => {
    STOP_HANDLERS[item.type]?.(item)
  })
}
