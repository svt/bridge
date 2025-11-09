// SPDX-FileCopyrightText: 2025 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *   text: String,
 *   ttl: Number | undefined,
 *   dismissable: Boolean | undefined
 * }} TextMessageSpec
 */

const uuid = require('uuid')

const InvalidArgumentError = require('../error/InvalidArgumentError')
const DIController = require('../../shared/DIController')
const DIBase = require('../../shared/DIBase')

const DEFAULT_MESSAGE_TTL_MS = 10000

class SMessages extends DIBase {
  #getMessageId () {
    return uuid.v4()
  }

  /**
   * Validate a message specification
   * @param { TextMessageSpec } spec
   * @param { any } override
   * @returns { TextMessageSpec }
   */
  #validateMessageSpec (spec, override = {}) {
    if (typeof spec !== 'object' || Array.isArray(spec)) {
      throw new InvalidArgumentError('Argument \'textMessageSpec\' must be a valid object that\'s not an array')
    }

    const validatedSpec = {
      ...spec,
      ...override
    }

    if (typeof validatedSpec?.text !== 'string') {
      throw new InvalidArgumentError('Argument \'textMessageSpec\' must contain a text property with a string value')
    }

    if (typeof validatedSpec?.ttl !== 'number' || validatedSpec?.ttl < 0) {
      validatedSpec.ttl = DEFAULT_MESSAGE_TTL_MS
    }

    return validatedSpec
  }

  /**
   * @param { TextMessageSpec } textMessageSpec
   */
  createWarningMessage (textMessageSpec) {
    const spec = this.#validateMessageSpec(textMessageSpec, {
      dismissable: true,
      type: 'warning',
      id: this.#getMessageId()
    })
    this.props.SEvents.emit('message', spec)
  }
}

DIController.main.register('SMessages', SMessages, [
  'SEvents'
])
