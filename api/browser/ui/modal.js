// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const DIController = require('../../../shared/DIController')

const MissingArgumentError = require('../../error/MissingArgumentError')
const InvalidArgumentError = require('../../error/InvalidArgumentError')

/**
 * @typedef {{
 *  uri: string
 * }} UIModalSpec
 */

class UIModal {
  #props

  constructor (props) {
    this.#props = props
  }

  makeId () {
    return `modal-${Math.floor(Math.random() * 100000)}`
  }

  /**
   * Close a modal by its id
   * @param { string } id
   */
  close (id) {
    if (!id || typeof id !== 'string') {
      throw new InvalidArgumentError('Missing or invalid argument \'id\', must be a string')
    }
    this.#props.Events.emitLocally('ui.modal.close', id)
  }

  /**
   * Open a new modal
   * @param { UIModalSpec } spec
   * @returns { string } An id for closing the modal
   */
  open (spec) {
    if (!spec) {
      throw new MissingArgumentError('Missing required argument \'spec\'')
    }

    if (!spec?.uri || typeof spec?.uri !== 'string') {
      throw new InvalidArgumentError('Missing or invalid property \'uri\' of the modal specification, must be a string')
    }

    const id = this.makeId()
    this.#props.Events.emitLocally('ui.modal.open', {
      id,
      ...spec
    })

    return id
  }
}

DIController.main.register('UIModal', UIModal, [
  'Events'
])
