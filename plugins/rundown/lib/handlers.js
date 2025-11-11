// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')
const commands = require('./commands')

const ITEM_ACTIONS = {
  playNextSibling: 1,
  selectNextSibling: 2
}

const MAIN_ROLE_ID = 1

const PLAY_HANDLERS = [
  /*
  Handle the on play option
  */
  {
    condition: item => item.data?.onPlay,
    fn: async item => {
      const value = parseInt(item?.data?.onPlay)

      if (value === ITEM_ACTIONS.playNextSibling) {
        const sibling = await commands.getNextSibling(item?.parent, item?.id)
        if (!sibling) {
          return
        }
        bridge.items.playItem(sibling)
        return
      }

      if (value === ITEM_ACTIONS.selectNextSibling) {
        const sibling = await commands.getNextSibling(item?.parent, item?.id)
        if (!sibling) {
          return
        }
        selectItem(sibling)
      }
    }
  }
]

const END_HANDLERS = [
  /*
  Handle the on play option
  */
  {
    condition: item => item.data?.onEnd,
    fn: async item => {
      const value = parseInt(item?.data?.onEnd)

      if (value === ITEM_ACTIONS.playNextSibling) {
        const sibling = await commands.getNextSibling(item?.parent, item?.id)
        if (!sibling) {
          return
        }
        bridge.items.playItem(sibling)
        return
      }

      if (value === ITEM_ACTIONS.selectNextSibling) {
        const sibling = await commands.getNextSibling(item?.parent, item?.id)
        if (!sibling) {
          return
        }
        selectItem(sibling)
      }
    }
  }
]

/**
 * Get the main client's id
 * @returns { Promise.<String | undefined> }
 */
async function getMainClientId () {
  const connections = await bridge.state.get('_connections')
  const main = Object.entries(connections)
    .filter(([_, value]) => value?.role === MAIN_ROLE_ID)
    .map(([key]) => {
      return key
    })

  return main[0]
}

/**
 * Select the specified item
 * in the main client
 * @param { String } id
 * @returns
 */
async function selectItem (id) {
  const mainClientId = await getMainClientId()
  if (mainClientId == null) {
    return
  }
  bridge.state.apply({
    _connections: {
      [mainClientId]: {
        /*
        Use a key that the
        client can listen to
        and act on
        */
        _serverSelection: { $replace: [id] }
      }
    }
  })
}

bridge.events.on('item.play', item => {
  for (const handler of PLAY_HANDLERS) {
    if (handler.condition(item)) {
      handler.fn(item)
    }
  }
})

bridge.events.on('item.end', item => {
  for (const handler of END_HANDLERS) {
    if (handler.condition(item)) {
      handler.fn(item)
    }
  }
})
