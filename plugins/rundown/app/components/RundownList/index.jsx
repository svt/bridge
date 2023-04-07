import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownDividerItem } from '../RundownDividerItem'
import { RundownGroupItem } from '../RundownGroupItem'
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
  'bridge.types.divider': RundownDividerItem,
  'bridge.types.group': RundownGroupItem
}

export function RundownList ({ rundownId = '', className = '' }) {
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()
  const selection = shared?.[bridge.client.getIdentity()]?.selection || []
  const itemIds = shared?.plugins?.['bridge-plugin-rundown']?.rundowns?.[rundownId]?.items || []

  /**
   * Focus a list item based on the
   * item's id that it's rendering
   *
   * This is done so that we can still
   * control the list by tabbing
   *
   * @param { String } id The item id of
   *                      the item to focus
   */
  function focusItemById (id) {
    const el = elRef.current.querySelector(`[data-item-id="${id}"]`)
    if (!el) {
      return
    }
    el.focus()
  }

  /**
   * Select the item n steps away
   * from the current selection
   * @param { Number } deltaIndex
   */
  function select (deltaIndex = 0) {
    if (itemIds.length === 0) {
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
    if (!curItemId && itemIds.length > 0) {
      focusItemById(itemIds[0])
      return
    }

    /*
    Increase or decrease the selected index,
    clamp it to the number of current items
    and select the new item
    */
    const items = Array.from(document.querySelectorAll('[data-item-id]'))
    const curItem = document.querySelector(`[data-item-id="${curItemId}"]`)
    const curIndex = items.indexOf(curItem)
    const newIndex = Math.max(0, Math.min(items.length - 1, curIndex + deltaIndex))
    items[newIndex].focus()
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
        case 'bridge.rundown.play':
          selection.forEach(itemId => bridge.items.playItem(itemId))
          break
        case 'bridge.rundown.stop':
          selection.forEach(itemId => bridge.items.stopItem(itemId))
          break
      }
    }
    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [itemIds, selection])

  function handleDrop (e, newIndex) {
    const itemId = e.dataTransfer.getData('itemId')
    const sourceRundownId = e.dataTransfer.getData('sourceRundownId')

    /*
    Remove the item from the source rundown
    if it was dragged here from another list
    */
    if (`${sourceRundownId}` !== `${rundownId}`) {
      bridge.commands.executeCommand('rundown.removeItem', sourceRundownId, itemId)
    }
    bridge.commands.executeCommand('rundown.reorderItem', rundownId, itemId, newIndex)
    e.stopPropagation()
  }

  function handleFocus (itemId) {
    bridge.client.setSelection(itemId)
  }

  function handleFocusPropagation (e) {
    e.stopPropagation()
  }

  return (
    <div ref={elRef} className={`RundownList ${className}`} onFocus={e => handleFocusPropagation(e)}>
      {
        (itemIds || [])
          .map(id => bridge.items.getLocalItem(id))
          .filter(item => item)
          .map((item, i) => {
            const isSelected = selection?.includes(item.id)
            const ItemComponent = TYPE_COMPONENTS[item.type] || RundownItem
            return (
              <RundownListItem
                key={i}
                item={item}
                rundownId={rundownId}
                onDrop={e => handleDrop(e, i)}
                onFocus={() => handleFocus(item.id)}
                selected={isSelected}
              >
                <ItemComponent index={i + 1} item={item} />
              </RundownListItem>
            )
          })
      }
    </div>
  )
}
