import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownItemIndicatorsSection } from '../RundownItemIndicatorsSection'
import { RundownItemTimeSection } from '../RundownItemTimeSection'
import { RundownItemProgress } from '../RundownItemProgress'
import { RundownList } from '../RundownList'
import { Icon } from '../Icon'

import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'

export function RundownGroupItem ({ index, item }) {
  const [shared] = React.useContext(SharedContext)

  const elRef = React.useRef()

  /**
   * Set this group to be
   * collapsed or expanded
   *
   * Will update the state
   * with the new value
   *
   * @param { Boolean } newState Whether or not the
   *                             group is collapsed
   */
  async function setCollapsed (newState) {
    if (!item?.id) {
      return
    }

    const selection = await bridge.client.getSelection()
    if (!(selection.includes(item.id))) {
      return
    }

    bridge.items.applyItem(item.id, {
      'rundown.ui.collapsed': newState
    })
  }

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
        case 'bridge.rundown.collapse':
          setCollapsed(true)
          break
        case 'bridge.rundown.expand':
          setCollapsed(false)
          break
      }
    }

    bridge.events.on('shortcut', onShortcut)
    return () => {
      bridge.events.off('shortcut', onShortcut)
    }
  }, [elRef, item])

  async function handleDrop (e) {
    e.stopPropagation()
    let itemId = e.dataTransfer.getData('text/plain')
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
        itemId = await bridge.items.createItem(spec.type)
        bridge.items.applyItem(itemId, spec)
      } catch (_) {
        console.warn('Tried to drop an invalid spec')
        return
      }
    }

    bridge.commands.executeCommand('rundown.appendItem', item.id, itemId)
  }

  /**
   * Prevent the event from propagating
   * so that we don't trigger the parent
   * rundown's listeners
   */
  function handleDragOver (e) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleToggleCollapsed (e) {
    e.stopPropagation()
    setCollapsed(!isCollapsed)
  }

  const itemIds = (shared?.items?.[item?.id]?.children || [])
    /*
    Remove any undefined
    or null entries
    */
    .filter(id => id)

  const isCollapsed = item?.['rundown.ui.collapsed']

  return (
    <div ref={elRef} className={`RundownGroupItem ${isCollapsed ? 'is-collapsed' : ''}`} data-item-type={item.type}>
      <div className='RundownGroupItem-color' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownGroupItem-background' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownGroupItem-header is-scrollTarget' onDoubleClick={e => handleToggleCollapsed(e)}>
        <div className='RundownGroupItem-index'>
          {index}
        </div>
        <div className='RundownGroupItem-arrowWrapper' onClick={e => handleToggleCollapsed(e)}>
          <div className='RundownGroupItem-arrow'>
            <Icon name='arrowDown' />
          </div>
        </div>
        <div className='RundownGroupItem-property RundownGroupItem-property--name'>
          <div className='RundownGroupItem-itemName'>
            {item?.data?.name}
          </div>
          <div className='RundownGroupItem-itemCount'>
            {itemIds.length} {itemIds.length === 1 ? 'item' : 'items'}
          </div>
        </div>
        <div className='RundownGroupItem-property RundownGroupItem-notes'>
          {item?.data?.notes}
        </div>
        <div className='RundownGroupItem-lastProperty'>
          <RundownItemIndicatorsSection item={item} />
          <RundownItemTimeSection item={item} />
        </div>
        <RundownItemProgress item={item} />
      </div>
      <div
        className='RundownGroupItem-dropGuard'
        onDragOver={e => handleDragOver(e)}
      >
        {
           (itemIds || []).length === 0 || isCollapsed
             ? (
               <div
                 className='RundownGroupItem-dropZone'
                 onDoubleClick={e => handleToggleCollapsed(e)}
                 onDrop={e => handleDrop(e)}
               />
               )
             : <RundownList className='RundownGroupItem-children' rundownId={item.id} indexPrefix={`${index}.`} disableShortcuts />
        }
      </div>
    </div>
  )
}

export function RundownGroupItemContext ({ item }) {
  function handleEnterGroup () {
    window.WIDGET_UPDATE({
      'rundown.id': item.id
    })
  }

  return (
    <>
      <ContextMenuItem text='Step inside' onClick={() => handleEnterGroup()} />
    </>
  )
}
