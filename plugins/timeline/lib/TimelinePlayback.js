// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

const DIController = require('./DIController')
const DIBase = require('../../../shared/DIBase')

const TIMELINE_TYPE = 'bridge.types.timeline'

class TimelinePlayback extends DIBase {
  /**
   * Wire up all event listeners
   * Call once from exports.activate
   */
  activate () {
    bridge.events.on('item.play', item => {
      if (item.type === TIMELINE_TYPE) {
        this.#onPlay(item)
      }
    })

    bridge.events.on('item.stop', item => {
      if (item.type === TIMELINE_TYPE) {
        this.#onStop(item)
      }
    })
  }

  /**
   * Handle item.play for a timeline
   * Plays all children respecting their own delay
   *
   * @param { any } item  The timeline item as passed by item.play
   */
  async #onPlay (item) {
    const children = item?.children || []
    for (const childId of children) {
      await bridge.items.playItem(childId)
    }
  }

  /**
   * Handle item.stop for a timeline
   * Stops all children
   *
   * @param { any } item
   */
  async #onStop (item) {
    const children = item?.children || []
    for (const childId of children) {
      await bridge.items.stopItem(childId)
    }
  }
}

DIController.register('TimelinePlayback', TimelinePlayback, [])
