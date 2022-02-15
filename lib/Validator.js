/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 * @description A helper for validating
 *              JSON using json-schemas
 */

const Ajv = require('ajv')

const pluginSchema = require('./schemas/plugin.schema.json')
const typeSchema = require('./schemas/type.schema.json')

const ajv = new Ajv({ schemas: [pluginSchema, typeSchema] })

/**
 * Get a validator function
 * for plugin manifests
 * @type { Ajv.ValidateFunction }
 */
function getPluginValidator () {
  return ajv.getSchema(pluginSchema.$id)
}
exports.getPluginValidator = getPluginValidator

/**
 * Get a validator function
 * for type declarations
 * @type { Ajv.ValidateFunction }
 */
function getTypeValidator () {
  return ajv.getSchema(typeSchema.$id)
}
exports.getTypeValidator = getTypeValidator
