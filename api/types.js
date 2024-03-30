// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const state = require('./state')
const events = require('./events')
const commands = require('./commands')

const Cache = require('./classes/Cache')

const CACHE_MAX_ENTRIES = 100
const cache = new Cache(CACHE_MAX_ENTRIES)

/**
 * Perform a deep clone
 * of an object
 * @param { any } obj An object to clone
 * @returns { any }
 */
function deepClone (obj) {
  if (typeof window !== 'undefined' && window.structuredClone) {
    return window.structuredClone(obj)
  }
  return JSON.parse(JSON.stringify(obj))
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
function renderType (id, typesDict = {}) {
  if (!typesDict[id]) return undefined

  const type = deepClone(typesDict[id])

  /*
  Render the ancestor if this
  type inherits properties
  */
  if (type.inherits) {
    const ancestor = renderType(type.inherits, typesDict)

    type.properties = {
      ...ancestor?.properties || {},
      ...type.properties || {}
    }
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
async function getTypeUncached (id) {
  const types = state.getLocalState()?._types ||
                await state.get('_types')

  return renderType(id, types)
}

/**
 * Get the full specification
 * for a type by its id
 *
 * @param { String } id The id of a type
 */
async function getType (id) {
  /*
  Use caching if it's safe to do so

  The cache key must depend on the local state revision
  in order to not get out of date, and that will only
  get updated if the client is listening for the
  'state.change' event
  */
  if (
    events.hasRemoteHandler('state.change') &&
    state.getLocalRevision() !== 0
  ) {
    return cache.cache(`${id}::${state.getLocalRevision()}`, async () => getTypeUncached(id))
  }

  return getTypeUncached(id)
}
exports.getType = getType

/**
 * Register a type
 * by its specification
 * @param { TypeSpecification } spec A type specification
 * @returns { Promise.<Boolean> }
 */
function registerType (spec) {
  return commands.executeCommand('types.registerType', spec)
}
exports.registerType = registerType
