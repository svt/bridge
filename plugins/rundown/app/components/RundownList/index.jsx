import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownVariableItem } from '../RundownVariableItem'
import { RundownDividerItem } from '../RundownDividerItem'
import { RundownGroupItem, RundownGroupItemContext } from '../RundownGroupItem'
import { RundownListItem } from '../RundownListItem'
import { RundownItem } from '../RundownItem'

import * as clipboard from '../../utils/clipboard'
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

export function RundownList ({
  rundownId = '',
  className = '',
  indexPrefix = ''
}) {
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()
  const itemIds = shared?.items?.[rundownId]?.children || []
  const selection = shared?._connections?.[bridge.client.getIdentity()]?.selection || []

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
    scrollIntoView(items[newIndex], true, scrollSettings?.centered)
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
    function onShortcut (shortcut) {
      switch (shortcut) {
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

    bridge.events.on('shortcut', onShortcut)
    return () => {
      bridge.events.off('shortcut', onShortcut)
    }
  }, [itemIds, selection])

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

  function handleFocus (itemId) {
    if (keyboard.keyIsPressed('meta')) {
      bridge.client.addSelection(itemId)
    } else {
      bridge.client.setSelection(itemId)
    }
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
            const isSelected = selection?.includes(item.id)
            const ItemComponent = TYPE_COMPONENTS[item.type]?.item || RundownItem
            const ExtraContextComponent = TYPE_COMPONENTS[item.type]?.context
            return (
              <RundownListItem
                key={item.id}
                item={item}
                index={i}
                rundownId={rundownId}
                onDrop={e => handleDrop(e, i)}
                onFocus={() => handleFocus(item.id)}
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
