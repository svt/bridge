// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  id: String,
 *  data: any
 * }} Item
 */

const objectPath = require('object-path')

const state = require('./state')
const types = require('./types')
const events = require('./events')
const random = require('./random')
const commands = require('./commands')
const variables = require('./variables')

const MissingArgumentError = require('./error/MissingArgumentError')
const InvalidArgumentError = require('./error/InvalidArgumentError')

/**
 * Create a new id for an item
 * that is unique and doesn't
 * already exist
 *
 * It's kept short to be
 * easy to work with
 *
 * @returns { String }
 */
function createUniqueId () {
  let proposal
  while (!proposal || state.getLocalState()?.items?.[proposal]) {
    proposal = random.string(4)
  }
  return proposal
}

/**
 * Create an item from of a specific
 * type and store it in the state
 * @param { String } type A type identifier to create an item from
 * @returns { Promise.<String> } A Promise resolving to the id of the created item
 */
async function createItem (type) {
  const _type = await types.getType(type)
  if (!_type) {
    throw new InvalidArgumentError('Received an invalid value for the argument \'type\', no such type exist')
  }

  const item = {
    id: createUniqueId(),
    type: _type.id,
    data: {}
  }

  for (const [key, def] of Object.entries(_type.properties)) {
    objectPath.set(item.data, key, def.default || undefined)
  }

  applyItem(item.id, item)
  return item.id
}
exports.createItem = createItem

/**
 * Apply changes to an
 * item in the state
 * @param { String } id The id of an item to update
 * @param { Item } item An item object to apply
 */
function applyItem (id, item = {}) {
  if (!(typeof id === 'string')) {
    throw new MissingArgumentError('Invalid value for item id, must be a string')
  }

  if (typeof item !== 'object' || Array.isArray(item)) {
    throw new InvalidArgumentError('Argument \'item\' must be a valid object that\'s not an array')
  }

  state.apply({
    items: {
      [id]: item
    }
  })
}
exports.applyItem = applyItem

/**
 * Get an item object by its id
 * @param { String } id The id for the item to get
 * @returns { Promise.<Item> }
 */
function getItem (id) {
  return commands.executeCommand('items.getItem', id)
}
exports.getItem = getItem

/**
 * Get the local representation of an item
 * @param { String } id The id of the item to get
 * @returns { Item }
 */
function getLocalItem (id) {
  const curState = state.getLocalState()
  return curState?.items?.[id]
}
exports.getLocalItem = getLocalItem

/**
 * Delete an item by its id
 *
 * Will trigger the
 * items.delete event
 *
 * @param { String } id
 */
function deleteItem (id) {
  deleteItems([id])
}
exports.deleteItem = deleteItem

/**
 * Delete multiple
 * items by their ids
 *
 * Will trigger the
 * items.delete event
 *
 * @param { String[] } ids
 */
async function deleteItems (ids) {
  return commands.executeCommand('items.deleteItems', ids)
}
exports.deleteItems = deleteItems

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
 * Populate any variable placeholders
 * in an item's properities - in place
 *
 * @param { any } item
 * @param { any } type
 * @returns { any } The item with modified property values
 */
function populateVariablesMutable (item, type) {
  if (!item.data) {
    item.data = {}
  }

  for (const key of Object.keys(type.properties)) {
    if (!type.properties[key].allowsVariables) {
      continue
    }
    const currentValue = objectPath.get(item.data, key)

    if (currentValue != null) {
      objectPath.set(item.data, key, variables.substituteInString(`${currentValue}`))
    }
  }

  return item
}

/**
 * Play the item and emit
 * the 'playing' event`
 * @param { String } id
 */
async function playItem (id) {
  const item = await getItem(id)
  const type = await types.getType(item.type)
  const clone = populateVariablesMutable(deepClone(item), type)

  clone.state = 'playing'
  applyItem(id, { state: 'playing' })
  events.emit('items.play', [clone])
}
exports.playItem = playItem

/**
 * Play the item and emit
 * the 'stop' event
 * @param { String } id
 */
async function stopItem (id) {
  const item = await getItem(id)
  applyItem(id, { state: 'stopped' })
  events.emit('items.stop', [item])
}
exports.stopItem = stopItem
