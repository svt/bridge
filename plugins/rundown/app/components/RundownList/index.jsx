import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

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

export function RundownList ({ rundownId = 1 }) {
  const [shared] = React.useContext(SharedContext)
  const items = shared?.plugins?.['bridge-plugin-rundown']?.rundowns?.[rundownId]?.items || []

  function handleDrop (e, itemId, toIndex) {
    bridge.commands.executeCommand('rundown.reorderItem', rundownId, itemId, toIndex)
  }

  return (
    <div className='RundownList'>
      {
        items.map((id, i) => {
          const item = bridge.items.getLocalItem(id)
          const ItemComponent = TYPE_COMPONENTS[item.type] || RundownItem
          return (
            <RundownListItem
              key={i}
              item={item}
              onDrop={(e, itemId) => handleDrop(e, itemId, i)}
            >
              <ItemComponent index={i + 1} item={item} />
            </RundownListItem>
          )
        })
      }
    </div>
  )
}
