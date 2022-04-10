// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  id: String,
 *  data: any
 * }} Item
 */

const uuid = require('uuid')

const state = require('./state')
const types = require('./types')

/**
 * Create an item from of a specific type
 * @param { String } type A type identifier to create an item from
 * @returns { Promise.<Item> }
 */
async function createItemOfType (type) {
  const _type = await types.getType(type)

  const item = {
    id: uuid.v4(),
    type: _type.id,
    data: {}
  }

  for (const prop of _type.properties) {
    item.data[prop.bind] = prop.default || undefined
  }

  return item
}
exports.createItemOfType = createItemOfType

/**
 * Store an item to the state
 * @param { Item } item An item object to store
 */
function storeItem (item) {
  state.apply({
    items: {
      [item.id]: item
    }
  })
}
exports.storeItem = storeItem

/**
 * Get an item object by its id
 * @param { String } id The id for the item to get
 * @returns { Promise.<Item> }
 */
async function getItem (id) {
  const curState = await state.get()
  return curState?.items?.[id]
}
exports.getItem = getItem

function deleteItem (id) {
  state.apply({
    items: {
      [id]: { $delete: true }
    }
  })
}
exports.deleteItem = deleteItem
