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
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    api.commands.executeCommand('scheduler.abort', undefined, `play:${item.id}`)

    /*
    Schedule a call to items.endItem if there's
    a specified delay and/or duration
    so that we can fire the item.end event
    */
    const endDelay = Math.max(item?.data?.delay || 0, 0) + Math.max(item?.data?.duration || 0, 0)
    if (!Number.isNaN(endDelay)) {
      api.commands.executeCommand('scheduler.delay', undefined, `end:${item.id}`, endDelay, 'items.endItem', item)
    } else {
      api.commands.executeCommand('scheduler.abort', undefined, `end:${item.id}`)
    }

    workspace.state.apply({
      items: {
        [item.id]: {
          state: 'playing',
          didStartPlayingAt: Date.now(),
          willStartPlayingAt: Date.now()
        }
      }
    })

    api.events.emit('item.play', item)
  }

  /**
   * Mark the end of an item
   * and emit the item.end event
   * @param { Item } item
   */
  function endItem (item) {
    api.events.emit('item.end', item)
  }

  /**
   * Schedule an item to be
   * played after a certain delay
   *
   * @param { Item } itemId
   * @param { Number } delay
   */
  function scheduleItem (item, delay) {
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    if (delay == null) {
      playItem(item)
      return
    }

    workspace.state.apply({
      items: {
        [item.id]: {
          state: 'scheduled',
          wasScheduledAt: Date.now(),
          willStartPlayingAt: Date.now() + delay
        }
      }
    })

    api.commands.executeCommand('scheduler.delay', undefined, `play:${item.id}`, delay, 'items.playItem', item)
    api.events.emit('item.schedule', item)
  }

  /**
   * Stop an item by its id
   * @param { Item } item
   */
  function stopItem (item) {
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    api.commands.executeCommand('scheduler.abort', undefined, `play:${item.id}`)
    api.commands.executeCommand('scheduler.abort', undefined, `end:${item.id}`)

    workspace.state.apply({
      items: {
        [item.id]: {
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

  api.commands.registerAsyncCommand('items.endItem', endItem)
  api.commands.registerAsyncCommand('items.playItem', playItem)
  api.commands.registerAsyncCommand('items.stopItem', stopItem)
  api.commands.registerAsyncCommand('items.scheduleItem', scheduleItem)

  api.commands.registerAsyncCommand('items.getItem', getItem)
  api.commands.registerAsyncCommand('items.deleteItems', deleteItems)
}
exports.factory = factory
