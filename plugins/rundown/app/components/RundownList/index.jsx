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

  const elRef = React.useRef()

  const selection = shared?.[bridge.client.getIdentity()]?.selection || []
  const items = shared?.plugins?.['bridge-plugin-rundown']?.rundowns?.[store?.id]?.items || []

  /**
   * Focus a list item based on the
   * item's id that it's rendering
   *
   * This is done so that we can still
   * control the list by tabbing
   */
  function focusItem (id) {
    const el = elRef.current.querySelector(`[data-item-id="${id}"]`)
    if (!el) {
      return
    }
    el.focus()
  }

  function select (deltaIndex = 0) {
    if (items.length === 0) {
      return
    }

    /*
    Find the currently selected item id,
    use the first selected item if going upwards
    and the last if going downwards
    */
    const curItemId = deltaIndex < 0
      ? selection[0]
      : selection[selection.length - 1]

    /*
    If no item is selected,
    select the first item
    */
    if (!curItemId && items.length > 0) {
      focusItem(items[0])
      return
    }

    /*
    Increase or decrease the selected index,
    clamp it to the number of current items
    and select the new item
    */
    const curIndex = items.findIndex(id => id === curItemId)
    const newIndex = Math.max(0, Math.min(items.length - 1, curIndex + deltaIndex))
    focusItem(items[newIndex])
  }

  React.useEffect(() => {
    function onShortcut (e) {
      switch (e.detail.id) {
        case 'bridge.rundown.next':
          select(1)
          break
        case 'bridge.rundown.previous':
          select(-1)
          break
      }
    }

    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [items, selection])

  function handleDrop (e, itemId, toIndex) {
    bridge.commands.executeCommand('rundown.reorderItem', store?.id, itemId, toIndex)
  }

  function handleFocus (itemId) {
    bridge.client.setSelection(itemId)
  }

  return (
    <div ref={elRef} className='RundownList'>
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
                      onFocus={() => handleFocus(item.id)}
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
