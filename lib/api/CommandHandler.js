// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Normalize user provided metadata, commands
 * are not exposed unless explicitly opted in
 * @param { Object } [metadata]
 * @returns {{ label: String, description: String, args: Object | undefined, exposed: Boolean }}
 */
function normalizeMetadata (metadata = {}) {
  const { label, description, args, exposed } = metadata ?? {}

  return {
    label: typeof label === 'string' ? label : '',
    description: typeof description === 'string' ? description : '',
    args: args && typeof args === 'object' ? args : undefined,
    exposed: exposed === true
  }
}

class CommandHandler {
  /**
   * Create a new handler
   * @param { HandlerFunction } handlerFn The handler's function
   * @param { String } owner The owner of the handler
   * @param { Object } [metadata]
   */
  constructor (handlerFn, owner, metadata) {
    /**
     * @readonly
     * @type { HandlerFunction }
     */
    this.call = handlerFn

    /**
     * @readonly
     * @type { String }
     */
    this.owner = owner

    /**
     * @readonly
     * @type { ReturnType<typeof normalizeMetadata> }
     */
    this.metadata = normalizeMetadata(metadata)
  }
}
module.exports = CommandHandler
