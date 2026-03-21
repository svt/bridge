// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @type { import('../../../api').Api }
 */
const bridge = require('bridge')

/**
 * Manages the per-timeline playback state when
 * driven by an external timecode source.
 *
 * Tracks which children have been triggered and
 * detects rewinds so they can be re-triggered correctly.
 *
 * This class is intentionally free of DI — it is
 * created and owned by SequencerRegistry.
 */
class TimelineSequencer {
  #timelineId
  #triggeredIds = new Set()
  #lastPositionMs = -1

  /**
   * @param { string } timelineId
   */
  constructor (timelineId) {
    this.#timelineId = timelineId
  }

  /**
   * Advance the sequencer to a new position.
   *
   * - Fires children whose delay has been reached
   * - Detects rewinds and re-arms any affected children
   * - Writes willStartPlayingAt to state so the UI
   *   can derive the playhead position
   *
   * @param { number } positionMs
   * @param { any[] } children Full child item objects
   */
  async advance (positionMs, children) {
    const rewound = this.#lastPositionMs >= 0 && positionMs < this.#lastPositionMs

    if (rewound) {
      await this.#reset(children)
      await bridge.items.seekItem(this.#timelineId, positionMs)
    }

    for (const child of children) {
      const delay = Number(child.data?.delay) || 0
      if (positionMs >= delay && !this.#triggeredIds.has(child.id)) {
        bridge.items.playItem(child.id, { immediate: true })
        this.#triggeredIds.add(child.id)
      }
    }

    bridge.items.applyItem(this.#timelineId, {
      state: 'playing',
      willStartPlayingAt: Date.now() - positionMs,
      didStartPlayingAt: Date.now() - positionMs
    })

    this.#lastPositionMs = positionMs
  }

  /**
   * Stop all triggered children and reset state.
   * Called when the timeline item is stopped.
   *
   * @param { any[] } children Full child item objects
   */
  async stop (children) {
    for (const child of children) {
      if (this.#triggeredIds.has(child.id)) {
        bridge.items.stopItem(child.id)
      }
    }
    this.#triggeredIds.clear()
    this.#lastPositionMs = -1
  }

  /**
   * Stop only the children that have been triggered so far
   * and clear the triggered set, without touching lastPositionMs.
   * Called internally when a rewind is detected.
   *
   * @param { any[] } children
   */
  async #reset (children) {
    for (const child of children) {
      if (this.#triggeredIds.has(child.id)) {
        bridge.items.stopItem(child.id)
      }
    }
    this.#triggeredIds.clear()
  }
}

module.exports = TimelineSequencer
