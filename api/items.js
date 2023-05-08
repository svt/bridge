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
  if (!id) {
    throw new MissingArgumentError()
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
  return state.get(`items.${id}`)
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
 * @param { String } id
 */
function deleteItem (id) {
  state.apply({
    items: {
      [id]: { $delete: true }
    }
  })
}
exports.deleteItem = deleteItem

/**
 * Play the item and emit
 * the 'playing' event
 * @param { String } id
 */
async function playItem (id) {
  const item = await getItem(id)
  applyItem(id, { state: 'playing' })
  events.emit('play', item)
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
  events.emit('stop', item)
}
exports.stopItem = stopItem
