// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('./DIController')
const DIBase = require('../../../shared/DIBase')

const TimelineSequencer = require('./TimelineSequencer')

/**
 * Owns the map of active TimelineSequencers.
 * Sequencers are created on first access and
 * removed when a timeline is unlatched or stopped.
 */
class SequencerRegistry extends DIBase {
  #sequencers = new Map()

  /**
   * Get the sequencer for a timeline, creating
   * one if it does not yet exist.
   *
   * @param { string } timelineId
   * @returns { TimelineSequencer }
   */
  getOrCreate (timelineId) {
    if (!this.#sequencers.has(timelineId)) {
      this.#sequencers.set(timelineId, new TimelineSequencer(timelineId))
    }
    return this.#sequencers.get(timelineId)
  }

  /**
   * Returns true if a sequencer exists for the given timeline.
   * @param { string } timelineId
   * @returns { boolean }
   */
  has (timelineId) {
    return this.#sequencers.has(timelineId)
  }

  /**
   * Remove a sequencer by timeline id.
   * Does not stop any in-flight playback — callers
   * are responsible for stopping children first.
   *
   * @param { string } timelineId
   */
  remove (timelineId) {
    this.#sequencers.delete(timelineId)
  }
}

DIController.register('SequencerRegistry', SequencerRegistry, [])

module.exports = SequencerRegistry
