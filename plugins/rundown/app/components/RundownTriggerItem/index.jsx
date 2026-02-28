import React from 'react'
import './style.css'

import bridge from 'bridge'

import { RundownItem } from '../RundownItem'

export function RundownTriggerItem ({ index, item }) {
  function handleDrop (itemId) {
    if (typeof itemId !== 'string') {
      return
    }

    /*
    Do not allow references to
    be dropped on themselves
    */
    if (itemId === item?.id) {
      return
    }

    bridge.items.applyItem(item.id, {
      data: {
        targetId: itemId
      }
    }, true)
  }

  return <RundownItem index={index} item={item} icon='trigger' onDrop={itemId => handleDrop(itemId)} dropzone />
}
