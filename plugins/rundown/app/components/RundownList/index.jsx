import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'
import { StoreContext } from '../../storeContext'

import { RundownDividerItem } from '../RundownDividerItem'
import { RundownListItem } from '../RundownListItem'
import { RundownItem } from '../RundownItem'
/**
 * Type-specific components that should be
 * rendered instead of the default RundownItem
 * component on a per-type-basis
 *
 * @type { Object.<String, ReactComponent> }
 */
const TYPE_COMPONENTS = {
  'bridge.types.divider': RundownDividerItem
}

export function RundownList () {
  const [shared] = React.useContext(SharedContext)
  const [store] = React.useContext(StoreContext)

  const items = shared?.plugins?.['bridge-plugin-rundown']?.rundowns?.[store?.id]?.items || []

  function handleDrop (e, itemId, toIndex) {
    bridge.commands.executeCommand('rundown.reorderItem', store?.id, itemId, toIndex)
  }

  return (
    <div className='RundownList'>
      {
        items
          .map(id => bridge.items.getLocalItem(id))
          .filter(item => item)
          .map((item, i) => {
            const ItemComponent = TYPE_COMPONENTS[item.type] || RundownItem
            return (
              <RundownListItem
                key={i}
                item={item}
                onDrop={(e, droppedItemId) => handleDrop(e, droppedItemId, i)}
              >
                <ItemComponent index={i + 1} item={item} />
              </RundownListItem>
            )
          })
      }
    </div>
  )
}
