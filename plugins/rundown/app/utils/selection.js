import bridge from 'bridge'

import * as clipboard from './clipboard'

/**
 * Toggle the disabled property
 * of the currently selected items
 * @returns { Promise.<void> }
 */
export async function toggleDisableSelection () {
  const selection = await bridge.client.selection.getSelection()

  const set = {
    items: {}
  }

  for (const itemId of selection) {
    set.items[itemId] = {
      data: {
        disabled: { $invert: true }
      }
    }
  }

  bridge.state.apply(set)
}

/**
 * Set the disabled property
 * of the currently selected items
 * @returns { Promise.<void> }
 */
export async function disableSelection (disabled) {
  const selection = await bridge.client.selection.getSelection()

  const set = {
    items: {}
  }

  for (const itemId of selection) {
    set.items[itemId] = {
      data: {
        disabled: !!disabled
      }
    }
  }

  bridge.state.apply(set)
}

/**
 * Delete the current selection
 *
 * Fetch the selection from the main thread before doing the deletion as
 * we want to make sure we don't delete the wrong items from an unsynced state
 *
 * @returns { Promise.<void> }
 */
export async function deleteSelection () {
  const selection = await bridge.client.selection.getSelection()
  bridge.items.deleteItems(selection)
}

/**
 * Copy a string representation of the
 * currently selected items to the clipboard
 *
 * @returns { Promise.<void> }
 */
export async function copySelection () {
  const selection = await bridge.client.selection.getSelection()
  const str = await bridge.commands.executeCommand('rundown.copyItems', selection)
  await clipboard.copyText(str)
}

/**
 * Play the currently selected items
 * @returns { Promise.<void> }
 */
export async function playSelection () {
  const selection = await bridge.client.selection.getSelection()
  selection.forEach(itemId => bridge.items.playItem(itemId))
}

/**
 * Stop the currently selected items
 * @returns { Promise.<void> }
 */
export async function stopSelection () {
  const selection = await bridge.client.selection.getSelection()
  selection.forEach(itemId => bridge.items.stopItem(itemId))
}
