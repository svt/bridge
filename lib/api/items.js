// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

function factory (api, workspace) {
  api.items = {}

  /**
   * Get a single item from the state
   * @param { String } id The id of the item to retrieve
   * @returns { any | undefined }
   */
  function getItem (id) {
    return workspace.state.data?.items?.[id]
  }

  /**
   * Remove a set of items
   * from the item-state,
   *
   * will trigger the
   * items.delete event
   *
   * Handling of parent-child relations
   * are done within the rundown-plugin
   *
   * @param { String[] } ids An array of ids to delete
   */
  async function deleteItems (ids) {
    if (ids.length === 0) {
      return
    }

    /*
    Fetch all items and filter out
    any non-existing items before
    operating on them
    */
    const items = ids
      .map(id => getItem(id))
      .filter(item => item)

    const patch = {}
    for (const item of items) {
      patch[item.id] = { $delete: true }
    }
    workspace.state.apply({
      items: patch
    })

    api.events.emit('items.delete', items)
  }

  api.items.getItem = getItem
  api.items.deleteItems = deleteItems
  api.commands.registerAsyncCommand('items.getItem', getItem)
  api.commands.registerAsyncCommand('items.deleteItems', deleteItems)
}
exports.factory = factory
