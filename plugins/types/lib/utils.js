// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

/**
 * Check if an item is an
 * ancestor of another item
 *
 * @param { String } ancestorId
 * @param { String } childId
 * @returns { Promise.<Boolean> }
 */
async function isAncestor (ancestorId, childId) {
  const items = await bridge.state.get('items')

  function check (ancestor, child) {
    if (!ancestor || !child) {
      return
    }

    if (child?.parent === ancestor?.id) {
      return true
    }

    if (!child?.parent || child?.parent === 'RUNDOWN_ROOT') {
      return false
    }

    return check(ancestor, items[child.parent])
  }

  return check(items[ancestorId], items[childId])
}

exports.isAncestor = isAncestor
