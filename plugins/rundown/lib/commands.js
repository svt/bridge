// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

/**
 * Get the id of the next sibling
 * from the specified item within
 * its parent item
 * @param { String } parentId
 * @param { String } itemId
 * @returns { Promise.<String | undefined> }
 */
async function getNextSibling (parentId, itemId) {
  const siblings = await bridge.state.get(`items.${parentId}.children`) || []
  const index = siblings.indexOf(itemId)
  return siblings[index + 1]
}
exports.getNextSibling = getNextSibling
