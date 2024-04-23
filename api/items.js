// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  id: String,
 *  data: any
 * }} Item
 *
 * @typedef {{
 *  description: String
 * }} ItemIssue
 */

const objectPath = require('object-path')

const state = require('./state')
const types = require('./types')
const client = require('./client')
const events = require('./events')
const random = require('./random')
const commands = require('./commands')
const variables = require('./variables')

const MissingArgumentError = require('./error/MissingArgumentError')
const InvalidArgumentError = require('./error/InvalidArgumentError')

const Cache = require('./classes/Cache')

const CACHE_MAX_ENTRIES = 10
const cache = new Cache(CACHE_MAX_ENTRIES)

/*
Intercept the item.change event
to always include the full item
*/
;(function () {
  events.intercept('item.change', async itemId => {
    return await getItem(itemId)
  })
})()

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
 *
 * @param { String } id The id of an item to update
 * @param { Item } set An item object to apply
 */
async function applyItem (id, set = {}) {
  if (typeof id !== 'string') {
    throw new MissingArgumentError('Invalid value for item id, must be a string')
  }

  if (typeof set !== 'object' || Array.isArray(set)) {
    throw new InvalidArgumentError('Argument \'item\' must be a valid object that\'s not an array')
  }

  await state.apply({
    items: {
      [id]: set
    }
  })
}
exports.applyItem = applyItem

/**
 * Apply changes to an
 * already existing item
 * in the state
 *
 * This function checks if the
 * item exists before applying
 * the data
 *
 * @param { String } id The id of an item to update
 * @param { Item } set An item object to apply
 */
async function applyExistingItem (id, set = {}) {
  if (typeof id !== 'string') {
    throw new MissingArgumentError('Invalid value for item id, must be a string')
  }

  const item = await getItem(id)
  if (!item) {
    throw new InvalidArgumentError('Invalid item id, item does not exist')
  }

  await applyItem(id, set)
}
exports.applyExistingItem = applyExistingItem

/**
 * Get an item object by its id
 * @param { String } id The id for the item to get
 * @returns { Promise.<Item> }
 */
function getItem (id) {
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
    return cache.cache(`${id}::${state.getLocalRevision()}`, () => commands.executeCommand('items.getItem', id))
  }
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
  /*
  Make sure any deleted items
  are no longer selected if available
  in the current context
  */
  if (typeof client?.subtractSelection === 'function') {
    client.subtractSelection(ids)
  }
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
 * @param { any } values
 * @returns { any } The item with modified property values
 */
function populateVariablesMutable (item, type, values) {
  if (!item.data) {
    item.data = {}
  }

  for (const key of Object.keys(type.properties)) {
    if (!type.properties[key].allowsVariables) {
      continue
    }
    const currentValue = objectPath.get(item.data, key)

    if (currentValue != null) {
      objectPath.set(item.data, key, JSON.parse(variables.substituteInString(JSON.stringify(currentValue), values)))
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

  if (!item) {
    return
  }

  if (item?.data?.disabled) {
    return
  }

  const type = await types.getType(item.type)
  const vars = await variables.getAllVariables()
  const clone = populateVariablesMutable(deepClone(item), type, vars)

  const delay = parseInt(clone?.data?.delay)

  if (delay && !Number.isNaN(delay)) {
    commands.executeCommand('items.scheduleItem', clone, delay)
  } else {
    commands.executeCommand('items.playItem', clone)
  }
}
exports.playItem = playItem

/**
 * Play the item and emit
 * the 'stop' event
 * @param { String } id
 */
async function stopItem (id) {
  const item = await getItem(id)

  if (!item) {
    return
  }

  if (item?.data?.disabled) {
    return
  }

  const type = await types.getType(item.type)
  const vars = await variables.getAllVariables()
  const clone = populateVariablesMutable(deepClone(item), type, vars)

  commands.executeCommand('items.stopItem', clone)
}
exports.stopItem = stopItem

/**
 * Add or update an
 * issue by its id
 *
 * An issue indicates a problem with an item
 * and may be reflected in the interface
 *
 * @param { String } itemId
 * @param { String } issueId
 * @param { ItemIssue } issueSpec
 */
async function applyIssue (itemId, issueId, issueSpec) {
  if (typeof itemId !== 'string') {
    throw new MissingArgumentError('Invalid value for item id, must be a string')
  }

  if (typeof issueId !== 'string') {
    throw new MissingArgumentError('Invalid value for issue id, must be a string')
  }

  if (typeof issueSpec !== 'object' || Array.isArray(issueSpec)) {
    throw new InvalidArgumentError('Argument \'issueSpec\' must be a valid object that\'s not an array')
  }

  await applyExistingItem(itemId, {
    issues: {
      [issueId]: {
        ts: Date.now(),
        ...issueSpec
      }
    }
  })
}
exports.applyIssue = applyIssue

/**
 * Remove an issue by its
 * id from an item
 *
 * @param { String } itemId
 * @param { String } issueId
 */
async function removeIssue (itemId, issueId) {
  if (typeof itemId !== 'string') {
    throw new MissingArgumentError('Invalid value for item id, must be a string')
  }

  if (typeof issueId !== 'string') {
    throw new MissingArgumentError('Invalid value for issue id, must be a string')
  }

  applyExistingItem(itemId, {
    issues: {
      [issueId]: { $delete: true }
    }
  })
}
exports.removeIssue = removeIssue
