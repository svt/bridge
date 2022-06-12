import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'
import { StoreContext } from '../../storeContext'

import { RundownDividerItem } from '../RundownDividerItem'
import { RundownListItem } from '../RundownListItem'
import { RundownItem } from '../RundownItem'

import { Icon } from '../Icon'

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

  function handleMouseDown (itemId) {
    bridge.client.setSelection(itemId)
  }

  const selection = shared?.[bridge.client.getIdentity()]?.selection

  return (
    <div className='RundownList'>
      {
        items.length > 0
          ? (
              items
                .map(id => bridge.items.getLocalItem(id))
                .filter(item => item)
                .map((item, i) => {
                  const isSelected = selection?.includes(item.id)
                  const ItemComponent = TYPE_COMPONENTS[item.type] || RundownItem
                  return (
                    <RundownListItem
                      key={i}
                      item={item}
                      onDrop={(e, droppedItemId) => handleDrop(e, droppedItemId, i)}
                      onMouseDown={() => handleMouseDown(item.id)}
                      selected={isSelected}
                    >
                      <ItemComponent index={i + 1} item={item} />
                    </RundownListItem>
                  )
                })
            )
          : (
            <div className='RundownList-empty'>
              <div className='RundownList-emptyContent'>
                <Icon name='empty' />
                <div>
                  Drag items here or create<br />
                  new ones by right-clicking
                </div>
              </div>
            </div>
            )
      }
    </div>
  )
}
