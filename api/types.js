// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const Cache = require('./classes/Cache')
const DIController = require('../shared/DIController')

const utils = require('./utils')

const CACHE_MAX_ENTRIES = 100

function shallowMergeObjects (a, b) {
  if (typeof a !== 'object' || typeof b !== 'object') {
    return b
  }

  return {
    ...a,
    ...b
  }
}

/*
Export for testing only
*/
exports.shallowMergeObjects = shallowMergeObjects

/**
 * Merge all properties two level deep
 * from two types
 * @param { any } a
 * @param { any } b
 * @returns { any }
 */
function mergeProperties (a, b) {
  const out = { ...a }
  for (const key of Object.keys(b)) {
    if (Object.prototype.hasOwnProperty.call(out, key)) {
      out[key] = shallowMergeObjects(a[key], b[key])
    } else {
      out[key] = b[key]
    }
  }
  return out
}

/*
Export for testing only
*/
exports.mergeProperties = mergeProperties

class Types {
  #props

  #cache = new Cache(CACHE_MAX_ENTRIES)

  constructor (props) {
    this.#props = props
  }

  /**
   * Render a complete type
   * from a set of type definitions
   *
   * This will make sure that
   * inheritance relations are
   * kept
   * @param { String } id
   * @param { Object.<String, Type> } typesDict
   * @returns { Type }
   */
  renderType (id, typesDict = {}) {
    if (!typesDict[id]) return undefined

    const type = utils.deepClone(typesDict[id])
    type.ancestors = []

    /*
    Render the ancestor if this
    type inherits properties
    */
    if (type.inherits) {
      const ancestor = this.renderType(type.inherits, typesDict)

      type.ancestors = [...(ancestor?.ancestors || []), type.inherits]
      type.category = type.category || ancestor?.category
      type.properties = mergeProperties(
        (ancestor?.properties || {}),
        (type?.properties || {})
      )
    }

    return type
  }

  /**
   * @private
   *
   * Get the full specification
   * for a type by its id without
   * going through the cache
   *
   * This is only to
   * be used internally,
   * always prefer the
   * cached version
   *
   * @param { String } id The id of a type
   */
  async getTypeUncached (id) {
    const types = this.#props.State.getLocalState()?._types ||
                  await this.#props.State.get('_types')

    return this.renderType(id, types)
  }

  /**
   * Get the full specification
   * for a type by its id
   *
   * @param { String } id The id of a type
   */
  async getType (id) {
    /*
    Use caching if it's safe to do so

    The cache key must depend on the local state revision
    in order to not get out of date, and that will only
    get updated if the client is listening for the
    'state.change' event
    */
    if (
      this.#props.Events.hasRemoteHandler('state.change') &&
      this.#props.State.getLocalRevision() !== 0
    ) {
      return this.#cache.cache(`${id}::${this.#props.State.getLocalRevision()}`, async () => this.getTypeUncached(id))
    }

    return this.getTypeUncached(id)
  }

  /**
   * Register a type
   * by its specification
   * @param { TypeSpecification } spec A type specification
   * @returns { Promise.<Boolean> }
   */
  registerType (spec) {
    return this.#props.Commands.executeCommand('types.registerType', spec)
  }
}

DIController.main.register('Types', Types, [
  'State',
  'Events',
  'Commands'
])
