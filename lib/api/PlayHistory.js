// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/*
The default size of the sliding window, i.e. the maximum
number of recent plays to keep in memory. Must be at least
twice the length of the largest expected cycle to detect it.
*/
const DEFAULT_WINDOW_SIZE = 500

class PlayHistory {
  #buffer
  #windowSize
  #head = 0
  #size = 0

  /**
   * @param { number } windowSize  The number of recent play events to
   *                               retain for cycle detection
   */
  constructor (windowSize = DEFAULT_WINDOW_SIZE) {
    this.#windowSize = windowSize
    this.#buffer = new Array(windowSize)
  }

  /**
   * Get a buffered entry by logical index,
   * where 0 is the oldest and size-1 is the newest
   *
   * @param { number } index
   * @returns { string }
   */
  #get (index) {
    return this.#buffer[(this.#head + index) % this.#windowSize]
  }

  /**
   * Record a play for an item and check
   * whether it is in a loop
   *
   * Appends the id to a sliding window and checks
   * whether the tail of that window forms a repeating
   * sequence. Returns true if a cycle is detected,
   * false otherwise.
   *
   * @param { string } id  The item id
   * @returns { boolean }
   */
  record (id) {
    const writePos = (this.#head + this.#size) % this.#windowSize
    this.#buffer[writePos] = id

    if (this.#size < this.#windowSize) {
      this.#size++
    } else {
      this.#head = (this.#head + 1) % this.#windowSize
    }

    /*
    Check whether the most recent L entries exactly repeat
    the L entries before them, for all possible cycle lengths
    */
    const maxCycleLength = Math.floor(this.#size / 2)
    for (let L = 1; L <= maxCycleLength; L++) {
      let match = true
      for (let i = 0; i < L; i++) {
        if (this.#get(this.#size - 1 - i) !== this.#get(this.#size - 1 - L - i)) {
          match = false
          break
        }
      }
      if (match) {
        return true
      }
    }

    return false
  }

  /**
   * Remove all occurrences of an item id from the buffer,
   * preserving the relative order of remaining entries
   *
   * @param { string } id  The item id
   */
  delete (id) {
    const entries = []
    for (let i = 0; i < this.#size; i++) {
      const val = this.#get(i)
      if (val !== id) {
        entries.push(val)
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
