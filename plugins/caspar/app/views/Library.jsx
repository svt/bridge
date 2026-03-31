import React from 'react'
import bridge from 'bridge'

import { Library as LibraryComponent } from '../components/Library'

async function handleDoubleClick (item) {
  const itemId = await bridge.items.createItem(item.type, item.data)
  bridge.commands.executeCommand('rundown.appendItem', 'RUNDOWN_ROOT', itemId)
}

export const Library = () => {
  return <LibraryComponent onItemDoubleClick={handleDoubleClick} />
}
