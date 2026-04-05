// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/*
The maximum number of consecutive plays each spaced
within LOOP_MAX_SPACING_MS of each other before an
item is considered to be in a loop
*/
const LOOP_MAX_PLAYS = 100

/*
The maximum spacing in milliseconds between two
consecutive plays that will increment the loop counter,
a gap larger than this resets the counter
*/
const LOOP_MAX_SPACING_MS = 20

/*
The default maximum number of item ids to track
before the oldest entry is evicted
*/
const DEFAULT_MAX_ENTRIES = 1000

class PlayHistory {
  #entries = new Map()
  #maxEntries

  /**
   * @param { number } maxEntries The maximum number of item ids to
   *                              track before the oldest is evicted
   */
  constructor (maxEntries = DEFAULT_MAX_ENTRIES) {
    this.#maxEntries = maxEntries
  }

  /**
   * Record a play for an item and check
   * whether it is in a loop
   *
   * Returns true if the item is considered
   * to be looping, false otherwise
   *
   * @param { string } id  The item id
   * @returns { boolean }
   */
  record (id) {
    const now = Date.now()
    const entry = this.#entries.get(id) ?? { lastPlayedAt: 0, count: 0 }

    if (now - entry.lastPlayedAt < LOOP_MAX_SPACING_MS) {
      entry.count++
    } else {
      entry.count = 1
    }

    entry.lastPlayedAt = now

    if (!this.#entries.has(id) && this.#entries.size >= this.#maxEntries) {
      this.#entries.delete(this.#entries.keys().next().value)
    }

    this.#entries.set(id, entry)

    return entry.count >= LOOP_MAX_PLAYS
  }

  /**
   * Remove the history for an item
   * @param { string } id  The item id
   */
  delete (id) {
    this.#entries.delete(id)
  }
}

module.exports = PlayHistory
