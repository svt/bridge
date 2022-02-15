/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 *
 * @typedef {{
 *  type: String,
 *  bind: String,
 *  properties?: TypeProperty[]
 * }} TypeProperty
 *
 * @typedef {{
 *  id: String,
 *  name?: String,
 *  properties: TypeProperty[]
 * }} Type
 */

const state = require('./state')

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

    type.properties = [
      ...ancestor?.properties || [],
      ...type.properties || []
    ]
  }

  return type
}

/**
 * Get the full specification
 * for a type by its id
 * @param { String } id The id of a type
 */
async function getType (id) {
  const current = await state.get()
  return renderType(id, current._types)
}
exports.getType = getType
