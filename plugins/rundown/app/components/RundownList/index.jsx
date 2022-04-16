import React from 'react'
import bridge from 'bridge'

import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownItem } from '../RundownItem'

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
          return (
            <RundownItem
              key={i}
              index={i + 1}
              item={item}
              onDrop={(e, itemId) => handleDrop(e, itemId, i)}
            />
          )
        })
      }
    </div>
  )
}
