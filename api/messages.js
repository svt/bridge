// SPDX-FileCopyrightText: 2022 Sveriges Television AB
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

const InvalidArgumentError = require('./error/InvalidArgumentError')
const DIController = require('../shared/DIController')

const DEFAULT_MESSAGE_TTL_MS = 10000

class Messages {
  #props

  get defaultMessageTtlMs () {
    return DEFAULT_MESSAGE_TTL_MS
  }

  constructor (props) {
    this.#props = props
  }

  #getMessageId () {
    return uuid.v4()
  }

  /**
   * Validate a message specification
   * @param { TextMessageSpec } spec
   * @param { any } override
   * @returns { TextMessageSpec }
   */
  validateMessageSpec (spec, override = {}) {
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
  createTextMessage (textMessageSpec) {
    const spec = this.validateMessageSpec(textMessageSpec, {
      dismissable: true,
      type: 'text',
      id: this.#getMessageId()
    })
    this.#props.Events.emit('message', spec)
  }

  /**
   * @param { TextMessageSpec } textMessageSpec
   */
  createSuccessMessage (textMessageSpec) {
    const spec = this.validateMessageSpec(textMessageSpec, {
      dismissable: true,
      type: 'success',
      id: this.#getMessageId()
    })
    this.#props.Events.emit('message', spec)
  }

  /**
   * @param { TextMessageSpec } textMessageSpec
   */
  createWarningMessage (textMessageSpec) {
    const spec = this.validateMessageSpec(textMessageSpec, {
      dismissable: true,
      type: 'warning',
      id: this.#getMessageId()
    })
    this.#props.Events.emit('message', spec)
  }
}

DIController.main.register('Messages', Messages, [
  'Events'
])
