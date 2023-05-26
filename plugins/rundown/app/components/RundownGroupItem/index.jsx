import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

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
  function setCollapsed (newState) {
    if (!item?.id) {
      return
    }

    const selection = shared?._connections?.[bridge.client.getIdentity()]?.selection || []
    if (!(selection.includes(item.id))) {
      return
    }

    bridge.items.applyItem(item.id, {
      'rundown.ui.collapsed': newState
    })
  }

  React.useEffect(() => {
    function onShortcut (e) {
      switch (e.detail.id) {
        case 'bridge.rundown.collapse':
          setCollapsed(true)
          break
        case 'bridge.rundown.expand':
          setCollapsed(false)
          break
      }
    }

    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [elRef, item])

  async function handleDrop (e) {
    e.stopPropagation()
    let itemId = e.dataTransfer.getData('itemId')
    const itemSpec = e.dataTransfer.getData('itemSpec')

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

  const itemIds = shared?.items?.[item?.id]?.children || []
  const isCollapsed = item?.['rundown.ui.collapsed']

  return (
    <div ref={elRef} className={`RundownGroupItem ${isCollapsed ? 'is-collapsed' : ''}`} data-item-type={item.type}>
      <div className='RundownGroupItem-color' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownGroupItem-header is-scrollTarget' onDoubleClick={() => setCollapsed(!isCollapsed)}>
        <div className='RundownGroupItem-index'>
          {index}
        </div>
        <div className='RundownGroupItem-arrowWrapper'>
          <div className='RundownGroupItem-arrow'>
            <Icon name='arrowDown' />
          </div>
        </div>
        <div className='RundownGroupItem-property'>
          {item?.data?.name}
        </div>
        <div className='RundownGroupItem-property RundownGroupItem-notes'>
          {item?.data?.notes}
        </div>
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
                 onDoubleClick={() => setCollapsed(!isCollapsed)}
                 onDrop={e => handleDrop(e)}
               />
               )
             : <RundownList className='RundownGroupItem-children' rundownId={item.id} indexPrefix={`${index}.`} />
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
