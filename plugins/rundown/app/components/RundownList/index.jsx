import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownVariableItem } from '../RundownVariableItem'
import { RundownDividerItem } from '../RundownDividerItem'
import { RundownGroupItem } from '../RundownGroupItem'
import { RundownListItem } from '../RundownListItem'
import { RundownItem } from '../RundownItem'

import * as clipboard from '../../utils/clipboard'

/**
 * Type-specific components that should be
 * rendered instead of the default RundownItem
 * component on a per-type-basis
 *
 * @type { Object.<String, ReactComponent> }
 */
const TYPE_COMPONENTS = {
  'bridge.variables.variable': RundownVariableItem,
  'bridge.types.divider': RundownDividerItem,
  'bridge.types.group': RundownGroupItem
}

/**
 * Scroll an element into view
 * @param { HTMLElement } el
 */
function scrollIntoView (el, animate = true) {
  if (!(el instanceof HTMLElement)) {
    return
  }
  el.scrollIntoView({
    behavior: animate ? 'smooth' : 'instant',
    block: 'center'
  })
}

export function RundownList ({ rundownId = '', className = '', indexPrefix = '' }) {
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()
  const selection = shared?.[bridge.client.getIdentity()]?.selection || []
  const itemIds = shared?.items?.[rundownId]?.data?.items || []

  function getItemElementById (id) {
    return elRef.current.querySelector(`[data-item-id="${id}"]`)
  }

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
    const el = getItemElementById(id)
    if (!el) {
      return
    }
    el.focus({
      preventScroll: true
    })
    scrollIntoView(el)
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
    items[newIndex].focus({
      preventScroll: true
    })
    scrollIntoView(items[newIndex])
  }

  /**
   * Copy a string representation of the
   * currently selected items to the clipboard
   */
  async function copySelection () {
    const str = await bridge.commands.executeCommand('rundown.copyItems', selection)
    await clipboard.copyText(str)
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
        case 'copy':
          copySelection()
          break
      }
    }
    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [itemIds, selection])

  /*
  Prevent the page to scroll
  from using the arrow-keys
  as it interferes with the
  selection and makes scrolling
  very unintuitive

  Scrolling is instead implemented
  upon selection of an item
  */
  React.useEffect(() => {
    if (!elRef.current) {
      return
    }
    function onKeyDown (e) {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault()
      }
    }

    elRef.current.addEventListener('keydown', onKeyDown)
    return () => {
      elRef.current.removeEventListener('keydown', onKeyDown)
    }
  }, [elRef.current])

  /*
  Try to scroll to the selection
  as soon as the list loads

  However, we must wait until
  'itemIds' is populated
  */
  const hasDoneInitialScrollingRef = React.useRef()
  React.useEffect(() => {
    if (itemIds.length === 0) {
      return
    }
    if (hasDoneInitialScrollingRef.current) {
      return
    }
    hasDoneInitialScrollingRef.current = true

    ;(async function () {
      const selection = await bridge.client.getSelection()
      const lastId = selection[selection.length - 1]
      if (!lastId) {
        return
      }
      const el = getItemElementById(lastId)
      scrollIntoView(el, false)
    })()
  }, [itemIds])

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
        (itemIds || [])
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
                <ItemComponent index={`${indexPrefix}${i + 1}`} item={item} />
              </RundownListItem>
            )
          })
      }
    </div>
  )
}
