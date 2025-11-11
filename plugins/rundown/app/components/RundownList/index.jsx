import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownVariableItem } from '../RundownVariableItem'
import { RundownDividerItem } from '../RundownDividerItem'
import { RundownGroupItem, RundownGroupItemContext } from '../RundownGroupItem'
import { RundownListItem } from '../RundownListItem'
import { RundownItem } from '../RundownItem'

import * as selectionUtils from '../../utils/selection'
import * as keyboard from '../../utils/keyboard'

/**
 * Type-specific components that should be
 * rendered instead of the default RundownItem
 * component on a per-type-basis
 *
 * @type { Object.<String, ReactComponent> }
 */
const TYPE_COMPONENTS = {
  'bridge.variables.variable': { item: RundownVariableItem },
  'bridge.types.divider': { item: RundownDividerItem },
  'bridge.types.group': {
    item: RundownGroupItem,
    context: RundownGroupItemContext
  }
}

/**
 * Scroll an element into view
 * @param { HTMLElement } el
 * @param { Boolean } animate Whether or not to animate the
 *                            scroll, defaults to true
 * @param { Boolean } centered Whether or not to use the vertical
 *                             center as the scroll origin
 */
function scrollIntoView (el, animate = true, centered = true) {
  if (!el) {
    return
  }

  /*
  Find a child of the element with the is-scrollTarget class
  in order to allow customization of the point to
  which an element is scrolled into view

  For example; a child at the top of the element can take on
  the is-scrollTarget class to scroll the header of the
  element into view
  */
  const target = el.querySelector('.is-scrollTarget') || el

  target.scrollIntoView({
    behavior: animate ? 'smooth' : 'instant',
    block: centered ? 'center' : 'nearest'
  })
}

/**
 * Blur the currently active element,
 * this should be called on mousedown
 * as that will enable the following
 * focus event
 * 
 * Without this an element that just was focused won't
 * trigger the focus event when clicked a second time,
 * causing the CMD+select operation to have no effect –
 * when it should, in fact, unselect the item
 * 
 * mousedown is always triggered before focus
 */
function blurActiveElementBeforeFocus () {
  document.activeElement?.blur()
}

export function RundownList ({
  rundownId = '',
  className = '',
  indexPrefix = '',
  disableShortcuts = false
}) {
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()
  const focusRef = React.useRef()

  const itemIds = shared?.items?.[rundownId]?.children || []

  const scrollSettings = shared?.plugins?.['bridge-plugin-rundown']?.settings?.scrolling

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
    scrollIntoView(el, true, scrollSettings?.centered)
  }

  /**
   * Select the item n steps away
   * from the current selection
   * @param { Number } deltaIndex
   */
  async function select (deltaIndex = 0) {
    if (itemIds.length === 0) {
      return
    }

    const selection = await bridge.client.selection.getSelection()

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
    scrollIntoView(items[newIndex], true, scrollSettings?.centered)
  }

  /*
  Handle selections that are made through the palette
  and scroll to the item if it's in this list
  */
  React.useEffect(() => {
    function onSelection (selection, state) {
      if (state?.caller !== 'palette') {
        return
      }

      if (!selection[0]) {
        return
      }

      const el = elRef.current.querySelector(`[data-item-id="${selection[0]}"]`)
      if (!el) {
        return
      }

      scrollIntoView(el, true, scrollSettings?.centered)
    }

    bridge.events.on('selection', onSelection)
    return () => {
      bridge.events.off('selection', onSelection)
    }
  }, [itemIds, rundownId, scrollSettings])

  React.useEffect(() => {
    function onShortcut (shortcut) {
      /*
      Don't execute any shortcuts
      if the frame isn't focused
      */
      if (!window.bridgeFrameHasFocus) {
        return
      }

      switch (shortcut) {
        case 'bridge.rundown.next':
          select(1)
          break
        case 'bridge.rundown.previous':
          select(-1)
          break
        case 'toggleDisable':
          selectionUtils.toggleDisableSelection()
          break
        case 'delete':
          selectionUtils.deleteSelection()
          break
        case 'play':
          selectionUtils.playSelection()
          break
        case 'stop':
          selectionUtils.stopSelection()
          break
        case 'copy':
          selectionUtils.copySelection()
          break
      }
    }

    if (disableShortcuts) {
      return
    }

    bridge.events.on('shortcut', onShortcut)
    return () => {
      bridge.events.off('shortcut', onShortcut)
    }
  }, [itemIds, rundownId, disableShortcuts])

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
      const selection = await bridge.client.selection.getSelection()
      const lastId = selection[selection.length - 1]
      if (!lastId) {
        return
      }
      const el = getItemElementById(lastId)
      scrollIntoView(el, false, scrollSettings?.centered)
    })()
  }, [itemIds])

  async function handleDrop (e, newIndex) {
    e.stopPropagation()

    const itemId = e.dataTransfer.getData('text/plain')
    const itemSpec = e.dataTransfer.getData('bridge/item')

    /*
    Allow item specifications to be dropped as well as ids
    in order to prevent zombie items, as they otherwise would
    have to be created before being dragged if the operation
    starts in another widget
    */
    if (itemSpec) {
      try {
        const spec = JSON.parse(itemSpec)
        if (!spec.type) {
          console.warn('Dropped spec is missing type')
          return
        }
        const itemId = await bridge.items.createItem(spec.type)

        bridge.items.applyItem(itemId, spec)
        bridge.commands.executeCommand('rundown.moveItem', rundownId, newIndex, itemId)
      } catch (_) {
        console.warn('Tried to drop an invalid spec')
      }
      return
    }
    bridge.commands.executeCommand('rundown.moveItem', rundownId, newIndex, itemId)
  }

  async function handleFocus (itemId) {
    /*
    Handle selection
    using the meta key
    */
    if (keyboard.keyIsPressed('meta')) {
      const isSelected = bridge.client.selection.isSelected(itemId)
      if (isSelected) {
        bridge.client.selection.subtractSelection(itemId)
      } else {
        bridge.client.selection.addSelection(itemId)
      }
      return
    }

    /*
    Handle selection
    using the shift key by
    looking up all elements
    between the focused ones
    and adding them to the
    selection
    */
    if (keyboard.keyIsPressed('shift')) {
      const selection = await bridge.client.selection.getSelection()
      const lastSelection = selection[selection.length - 1]

      if (!lastSelection) {
        bridge.client.selection.addSelection(itemId)
        return
      }

      const listItems = Array.from(elRef.current.querySelectorAll('.RundownListItem'))
      const indexA = listItems.findIndex(el => el.dataset.itemId === lastSelection)
      const indexB = listItems.findIndex(el => el.dataset.itemId === itemId)

      const firstIndex = Math.min(indexA, indexB)
      const lastIndex = Math.max(indexA, indexB)

      const itemsBetween = listItems
        .slice(firstIndex, lastIndex + 1)
        .map(el => el.dataset.itemId)

      /*
      Make sure that all elements are added
      to the selection in the correct order
      */
      if (indexA > indexB) {
        itemsBetween.reverse()
      }

      bridge.client.selection.addSelection(itemsBetween)
      return
    }

    bridge.client.selection.setSelection(itemId)
  }

  function handleFocusPropagation (e) {
    e.stopPropagation()
  }

  /*
  Prevent the page to scroll
  from using the arrow-keys
  as it interferes with the
  selection and makes scrolling
  very unintuitive

  Scrolling is instead implemented
  upon selection of an item
  */
  function handleKeyDown (e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
    }
  }

  return (
    <div
      ref={elRef}
      className={`RundownList ${className}`}
      onDrop={e => handleDrop(e, itemIds.length)}
      onFocus={e => handleFocusPropagation(e)}
      /*
      We need to prevent onDragOver
      for onDrop to be fired,
      this is standard behaviour
      for div-elements
      */
      onDragOver={e => e.preventDefault()}
      onKeyDown={e => handleKeyDown(e)}
    >
      {
        itemIds.length === 0 &&
        <div className="RundownList-empty">This rundown is empty,<br/>get started by adding a new item</div>
      }
      {
        itemIds
          .map(id => bridge.items.getLocalItem(id))
          .filter(item => item)
          .map((item, i) => {
            const isSelected = bridge.client.selection.isSelected(item.id)
            const ItemComponent = TYPE_COMPONENTS[item.type]?.item || RundownItem
            const ExtraContextComponent = TYPE_COMPONENTS[item.type]?.context
            return (
              <RundownListItem
                key={item.id}
                item={item}
                index={i}
                rundownId={rundownId}
                onDrop={e => handleDrop(e, i)}
                onFocus={e => handleFocus(item.id)}
                onMouseDown={e => blurActiveElementBeforeFocus()}
                extraContextItems={ExtraContextComponent}
                selected={isSelected}
              >
                <ItemComponent index={`${indexPrefix}${i + 1}`} item={item}/>
              </RundownListItem>
            )
          })
      }
    </div>
  )
}
