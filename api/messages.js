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

const InvalidArgumentError = require('./error/InvalidArgumentError')
const DIController = require('../shared/DIController')

const DEFAULT_MESSAGE_TTL_MS = 10000
const FINISH_LINGER_MS = 400

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

  /**
   * Show a local message with a progress bar
   * until it's finished or dismissed by the user
   *
   * The message is only shown in this client
   *
   * @param {{ text: String, progress: Number= }} spec Progress is a number
   *                                                    between 0 and 1,
   *                                                    leave it out for an
   *                                                    indeterminate bar
   * @returns {{
   *  id: String,
   *  update: (set: { progress: Number=, text: String= }) => void,
   *  finish: () => void,
   *  dismiss: () => void
   * }}
   */
  createProgressMessage (spec) {
    const validated = this.validateMessageSpec(spec, {
      dismissable: true,
      ttl: 0,
      type: 'progress',
      id: this.#getMessageId()
    })
    const id = validated.id

    this.#props.Events.emitLocally('message', validated)

    const dismiss = () => this.#props.Events.emitLocally('message.dismiss', id)

    return {
      id,
      update: set => this.#props.Events.emitLocally('message.update', id, set),
      dismiss,
      finish: () => {
        this.#props.Events.emitLocally('message.update', id, { progress: 1 })
        setTimeout(dismiss, FINISH_LINGER_MS)
      }
    }
  }
}

DIController.main.register('Messages', Messages, [
  'Events'
])
