// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const ApiError = require('../error/ApiError')

class SItems extends DIBase {
  constructor (...args) {
    super(...args)
    this.#setup()
  }

  #setup () {
    this.props.SCommands.registerAsyncCommand('items.endItem', this.endItem.bind(this))
    this.props.SCommands.registerAsyncCommand('items.playItem', this.playItem.bind(this))
    this.props.SCommands.registerAsyncCommand('items.stopItem', this.stopItem.bind(this))
    this.props.SCommands.registerAsyncCommand('items.scheduleItem', this.scheduleItem.bind(this))
    this.props.SCommands.registerAsyncCommand('items.getItem', this.getItem.bind(this))
    this.props.SCommands.registerAsyncCommand('items.deleteItems', this.deleteItems.bind(this))
  }

  /**
   * Play an item
   *
   * @typedef {{
   *  id: String
   * }} Item
   *
   * @param { Item } item
   */
  playItem (item) {
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    this.props.SCommands.executeCommand('scheduler.abort', undefined, `play:${item.id}`)

    /*
    Schedule a call to items.endItem if there's
    a specified delay and/or duration
    so that we can fire the item.end event
    */
    const endDelay = Math.max(item?.data?.duration || 0, 0)
    if (!Number.isNaN(endDelay) && endDelay > 0) {
      this.props.SCommands.executeCommand('scheduler.delay', undefined, `end:${item.id}`, endDelay, 'items.endItem', item)
    } else {
      this.props.SCommands.executeCommand('scheduler.abort', undefined, `end:${item.id}`)
      this.endItem(item)
    }

    this.props.SState.applyState({
      items: {
        [item.id]: {
          state: 'playing',
          didStartPlayingAt: Date.now(),
          willStartPlayingAt: Date.now()
        }
      }
    })

    this.props.SEvents.emit('item.play', item)
  }

  /**
   * Mark the end of an item
   * and emit the item.end event
   * @param { Item } item
   */
  endItem (item) {
    this.props.SEvents.emit('item.end', item)
  }

  /**
   * Schedule an item to be
   * played after a certain delay
   *
   * @param { Item } itemId
   * @param { Number } delay
   */
  scheduleItem (item, delay) {
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    if (delay == null) {
      this.playItem(item)
      return
    }

    this.props.SState.applyState({
      items: {
        [item.id]: {
          state: 'scheduled',
          wasScheduledAt: Date.now(),
          willStartPlayingAt: Date.now() + delay
        }
      }
    })

    this.props.SCommands.executeCommand('scheduler.delay', undefined, `play:${item.id}`, delay, 'items.playItem', item)
    this.props.SEvents.emit('item.schedule', item)
  }

  /**
   * Stop an item by its id
   * @param { Item } item
   */
  stopItem (item) {
    if (!item?.id) {
      throw new ApiError('Invalid item object', 'ERR_API_ITEMS_INVALID_ITEM')
    }

    this.props.SCommands.executeCommand('scheduler.abort', undefined, `play:${item.id}`)
    this.props.SCommands.executeCommand('scheduler.abort', undefined, `end:${item.id}`)

    this.props.SState.applyState({
      items: {
        [item.id]: {
          state: 'stopped'
        }
      }
    })

    this.props.SEvents.emit('item.stop', item)
  }

  /**
   * Get a single item from the state
   * @param { String } id The id of the item to retrieve
   * @returns { any | undefined }
   */
  getItem (id) {
    return this.props.Workspace.state.data?.items?.[id]
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
  async deleteItems (ids) {
    if (ids.length === 0) {
      return
    }

    /*
    Fetch all items and filter out
    any non-existing items before
    operating on them
    */
    const items = ids
      .map(id => this.getItem(id))
      .filter(item => item)

    const patch = {}
    for (const item of items) {
      patch[item.id] = { $delete: true }
    }
    this.props.SState.applyState({
      items: patch
    })

    this.props.SEvents.emit('items.delete', items)
  }
}

DIController.main.register('SItems', SItems, [
  'Workspace',
  'SCommands',
  'SEvents',
  'SState'
])
