import React from 'react'
import './style.css'

import bridge from 'bridge'

import { RundownItem } from '../RundownItem'

export function RundownReferenceItem ({ index, item }) {
  function handleDrop (itemId) {
    if (typeof itemId !== 'string') {
      return
    }
    bridge.items.applyItem(item.id, {
      data: {
        targetId: itemId
      }
    }, true)
  }

  return <RundownItem index={index} item={item} onDrop={itemId => handleDrop(itemId)} dropzone />
}
