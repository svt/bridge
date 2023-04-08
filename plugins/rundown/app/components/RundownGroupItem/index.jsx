import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownList } from '../RundownList'
import { Icon } from '../Icon'

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

    const selection = shared?.[bridge.client.getIdentity()]?.selection || []
    if (!(selection.includes(item.id))) {
      return
    }

    bridge.items.applyItem(item.id, {
      'rundown.isCollapsed': newState
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
  }, [elRef])

  function handleDrop (e) {
    e.stopPropagation()
    const itemId = e.dataTransfer.getData('itemId')
    const sourceRundownId = e.dataTransfer.getData('sourceRundownId')

    /*
    Remove the item from the source rundown
    if it is dropped here from another rundown
    */
    if (`${sourceRundownId}` !== item.id) {
      bridge.commands.executeCommand('rundown.removeItem', sourceRundownId, itemId)
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

  const itemIds = shared?.plugins?.['bridge-plugin-rundown']?.rundowns?.[item?.id]?.items || []
  const isCollapsed = item?.['rundown.isCollapsed']

  return (
    <div ref={elRef} className={`RundownGroupItem ${isCollapsed ? 'is-collapsed' : ''}`} data-item-type={item.type}>
      <div className='RundownGroupItem-color' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownGroupItem-header'>
        <div className='RundownGroupItem-index'>
          {index}
        </div>
        <div className='RundownGroupItem-arrow'>
          <Icon name='arrowDown'/>
        </div>
        <div className='RundownGroupItem-name'>
          {item?.data?.name}
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
                 onDrop={e => handleDrop(e)}
               />
               )
             : <RundownList className='RundownGroupItem-children' rundownId={item.id} />
        }
      </div>
    </div>
  )
}
