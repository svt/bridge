// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Validator = require('../Validator')
const MissingTypeError = require('../error/MissingTypeError')

/**
 * A factory function
 * for the types API
 * @param { import('./index.js').Api } api
 * @param { import('../Workspace') } workspace
 */
function factory (api, workspace) {
  /**
   * @type { TypesApi }
   */
  api.types = {}

  /**
   * Register a type by
   * its specification
   * @param { TypeSpecification } specification A type specification
   * @returns { Promise.<Boolean> }
   */
  function registerType (specification) {
    const validate = Validator.getTypeValidator()
    const isValid = validate(specification)

    if (!isValid) {
      throw Validator.getFirstError(validate)
    }

    workspace.state.apply({
      _types: {
        [specification.id]: {
          ...specification
        }
      }
    })
    return true
  }
  api.types.registerType = registerType

  /**
   * Remove a type declaration
   * @param { String } id The id of the type to remove
   * @returns { Promise.<Boolean> }
   */
  function removeType (id) {
    if (!workspace.state.data._types?.[id]) {
      throw new MissingTypeError()
    }
    workspace.state.apply({
      _types: {
        [id]: { $delete: true }
      }
    })
    return true
  }
  api.types.removeType = removeType

  api.commands.registerAsyncCommand('types.registerType', registerType)
  api.commands.registerAsyncCommand('types.removeType', removeType)
}
exports.factory = factory
