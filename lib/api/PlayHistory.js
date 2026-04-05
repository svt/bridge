// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * The default size of the circular buffer, i.e. the maximum
 * number of recent plays to keep in memory
 *
 * Only patterns up to half this size can be detected as
 * it needs to appear at lease twice within the buffer
 *
 * @type { number }
 */
const DEFAULT_BUFFER_SIZE_ENTRIES_N = 500

/**
 * The maximum number of milliseconds allowed between any two
 * consecutive plays within a detected cycle for it to be
 * considered a runaway loop. If any single step in the cycle
 * took longer than this (e.g. an item waiting out its duration),
 * the sequence is considered intentional rather than a loop
 *
 * @type { number }
 */
const MAX_MS_PER_STEP = 10

/**
 * @class PlayHistory
 * @description Keeps track of played items and
 *              flags an item as a loop if it occurs
 *              twice within the circular buffer and
 *              breaks the timing threshold
 *
 * @typedef {{ id: string, t: number }} Entry
 */
class PlayHistory {
  #buffer
  #windowSize
  #head = 0
  #size = 0

  /**
   * @param { number } windowSize The number of recent play events to
   *                              retain for cycle detection
   */
  constructor (windowSize = DEFAULT_BUFFER_SIZE_ENTRIES_N) {
    this.#windowSize = windowSize
    this.#buffer = new Array(windowSize)
  }

  /**
   * Get a buffered entry by logical index,
   * where 0 is the oldest and size-1 is the newest
   *
   * @param { number } index
   * @returns { Entry }
   */
  #get (index) {
    return this.#buffer[(this.#head + index) % this.#windowSize]
  }

  /**
   * Record a play for an item and check
   * whether it is in a loop
   *
   * Appends the id and current timestamp to a sliding window
   * and checks whether the tail of that window forms a repeating
   * sequence whose total duration is within the loop time budget
   *
   * Returns true if a loop is detected, false otherwise
   *
   * @param { string } id The item id
   * @returns { boolean } True if a loop is detected
   */
  record (id) {
    const now = Date.now()
    const writePos = (this.#head + this.#size) % this.#windowSize
    this.#buffer[writePos] = { id, t: now }

    if (this.#size < this.#windowSize) {
      this.#size++
    } else {
      this.#head = (this.#head + 1) % this.#windowSize
    }

    /*
    Check whether the most recent L entries exactly repeat
    the L entries before them, for all possible cycle lengths,
    and that the most recent full cycle completed within the
    time budget of L × MAX_MS_PER_ITEM milliseconds
    */
    const maxCycleLength = Math.floor(this.#size / 2)
    for (let L = 1; L <= maxCycleLength; L++) {
      let match = true
      for (let i = 0; i < L; i++) {
        if (this.#get(this.#size - 1 - i).id !== this.#get(this.#size - 1 - L - i).id) {
          match = false
          break
        }
      }
      if (!match) {
        continue
      }

      /*
      Check that every step within the last cycle
      fired within MAX_MS_PER_STEP of the previous play

      A single large gap means an item waited out its duration — intentional, not a loop
      */
      let isRunaway = true
      for (let i = this.#size - L; i < this.#size; i++) {
        const gap = this.#get(i).t - this.#get(i - 1).t
        if (gap > MAX_MS_PER_STEP) {
          isRunaway = false
          break
        }
      }
      if (isRunaway) {
        return true
      }
    }

    return false
  }

  /**
   * Remove all occurrences of an item id from the buffer,
   * preserving the relative order of remaining entries
   *
   * @param { string } id The item id
   */
  delete (id) {
    const entries = []
    for (let i = 0; i < this.#size; i++) {
      const entry = this.#get(i)
      if (entry.id !== id) {
        entries.push(entry)
      }
    }
    this.#head = 0
    this.#size = entries.length
    for (let i = 0; i < entries.length; i++) {
      this.#buffer[i] = entries[i]
    }
  }
}

module.exports = PlayHistory
