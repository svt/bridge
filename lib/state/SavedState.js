// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

const fe = require('fast-equals')

const State = require('./State')

/**
 * @class SavedState
 *
 * @description This extension of the state
 *              keeps track of the save-state,
 *              that is, if changes to its data
 *              have been made since it was last
 *              written to disk or not
 *
 *              This will be stored in the special
 *              _hasUnsavedChanges property
 *              so that other components
 *              can react to it
 */
class SavedState extends State {
  #lastSavedState

  /**
   * Check if this state has
   * changed since it was last saved
   * @returns
   */
  hasChangedSinceLastSave () {
    if (!this.#lastSavedState) {
      return false
    }
    return !fe.deepEqual(this.getPersistentData(), this.#lastSavedState)
  }

  /**
   * Make a deep clone of
   * the persistent
   * keys of this state
   * @returns { any }
   */
  #deepClonePersistentData () {
    return JSON.parse(JSON.stringify(this.getPersistentData()))
  }

  /**
   * Mark the current data
   * of the state as saved
   *
   * This function should
   * be called whenever the
   * data is written to disk
   */
  markAsSaved () {
    this.#lastSavedState = this.#deepClonePersistentData()
    super.apply({
      _hasUnsavedChanges: false
    })
  }

  /**
   * @see {@link State#apply}
   */
  apply (set, transparent) {
    /*
    If no last saved state exists,
    consider this to be the first apply
    and mark the current data as saved
    */
    if (!this.#lastSavedState) {
      this.markAsSaved()
    }

    super.apply(set, transparent)

    const hasChanged = this.hasChangedSinceLastSave()
    if (this.data._hasUnsavedChanges !== hasChanged) {
      super.apply({
        _hasUnsavedChanges: hasChanged
      })
    }
  }
}

module.exports = SavedState
