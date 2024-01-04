// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ApiError = require('../error/ApiError')

function factory (api, workspace) {
  api.items = {}

  /**
   * Play an item
   *
   * @typedef {{
   *  id: String
   * }} Item
   *
   * @param { Item } item
   */
  function playItem (item) {
    if (!item.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    workspace.state.apply({
      items: {
        [item.id]: {
          state: 'playing',
          didStartPlayingAt: Date.now()
        }
      }
    })

    api.events.emit('item.play', item)
  }

  /**
   * Stop an item by its id
   * @param { String } id
   */
  function stopItem (id) {
    const item = getItem(id)
    if (!item) {
      return
    }

    workspace.state.apply({
      items: {
        [id]: {
          state: 'stopped'
        }
      }
    })

    api.events.emit('item.stop', item)
  }

  /**
   * Get a single item from the state
   * @param { String } id The id of the item to retrieve
   * @returns { any | undefined }
   */
  function getItem (id) {
    return workspace.state.data?.items?.[id]
  }

  /**
   * Remove a set of items
   * from the item-state,
   *
   * will trigger the
   * items.delete event
   *
   * Handling of parent-child relations
   * are done within the rundown-plugin
   *
   * @param { String[] } ids An array of ids to delete
   */
  async function deleteItems (ids) {
    if (ids.length === 0) {
      return
    }

    /*
    Fetch all items and filter out
    any non-existing items before
    operating on them
    */
    const items = ids
      .map(id => getItem(id))
      .filter(item => item)

    const patch = {}
    for (const item of items) {
      patch[item.id] = { $delete: true }
    }
    workspace.state.apply({
      items: patch
    })

    api.events.emit('items.delete', items)
  }

  api.items.getItem = getItem
  api.items.deleteItems = deleteItems

  api.commands.registerAsyncCommand('items.playItem', playItem)
  api.commands.registerAsyncCommand('items.stopItem', stopItem)

  api.commands.registerAsyncCommand('items.getItem', getItem)
  api.commands.registerAsyncCommand('items.deleteItems', deleteItems)
}
exports.factory = factory
