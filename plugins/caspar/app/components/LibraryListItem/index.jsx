import React from 'react'
import bridge from 'bridge'
import './style.css'

import * as asset from '../../utils/asset'

const DEFAULT_DURATION_MS = 5000

const DEFAULT_VALUES = {
  [asset.type.still]: {
    channel: 1,
    layer: 10
  },
  [asset.type.movie]: {
    channel: 1,
    layer: 10
  },
  [asset.type.audio]: {
    channel: 1,
    layer: 30
  },
  [asset.type.template]: {
    channel: 1,
    layer: 20
  }
}

/**
 * Item constructor functions
 * for creating different types
 * of item inits based on
 * a specific condition
 */
const ITEM_CONSTRUCTORS = [
  {
    if: item => [asset.type.still, asset.type.movie, asset.type.audio].includes(item.type),
    fn: item => {
      return {
        type: 'bridge.caspar.media',
        data: {
          name: item.name,
          caspar: {
            server: item?._filter?.serverId,
            target: item.name,
            ...(DEFAULT_VALUES[item.type] || {})
          },
          duration: calculateDurationMs(item)
        }
      }
    }
  },
  {
    if: item => asset.type.template === item.type,
    fn: item => {
      return {
        type: 'bridge.caspar.template',
        data: {
          name: item.name,
          caspar: {
            server: item?._filter?.serverId,
            target: item.name,
            ...(DEFAULT_VALUES[item.type] || {})
          }
        }
      }
    }
  }
]

/**
 * Create an item init object for a library item
 * @param { LibraryAsset } libraryAsset
 * @returns { ItemInit | undefined }
 */
function constructPlayableItemInit (libraryAsset) {
  for (const constructor of ITEM_CONSTRUCTORS) {
    if (constructor.if(libraryAsset)) {
      return constructor.fn(libraryAsset)
    }
  }
}

/**
 * Calculate the duration in milliseconds from an item
 * based on its framerate and duration in frames
 * @param { any } item
 * @returns { Number }
 */
function calculateDurationMs (item) {
  if (!item?.duration) {
    return DEFAULT_DURATION_MS
  }

  if (!item?.framerate) {
    return DEFAULT_DURATION_MS
  }

  /**
   * Extract the framerate from the item - which is written as a fraction
   * @example
   * '1/25' -> 25
   * '1001/30000' -> 29.97
   */
  const [divisor, dividend] = item?.framerate.split('/')
  const framerate = dividend / divisor;


  return (item?.duration / framerate) * 1000
}

/**
 * @typedef { import('../../utils/asset').LibraryAsset } LibraryAsset
 *
 * @param {{
 *  item: LibraryAsset
 * }} arg0
 */
export const LibraryListItem = ({ item = {} }) => {
  async function handleDragStart (e) {
    const data = constructPlayableItemInit(item)
    e.dataTransfer.setData('bridge/item', JSON.stringify(data))
    e.stopPropagation()
  }

  /*
   * Create a new item and append it to
   * the rundown root on double click
   */
  async function handleDoubleClick (e) {
    const data = constructPlayableItemInit(item)
    const itemId = await bridge.items.createItem(data.type, data.data)
    bridge.commands.executeCommand('rundown.appendItem', 'RUNDOWN_ROOT', itemId)
  }

  return (
    <li
      className='LibraryListItem'
      onDragStart={e => handleDragStart(e)}
      onDoubleClick={e => handleDoubleClick(e)}
      draggable
    >
      <div className='LibraryListItem-name LibraryListItem-col' title={item?.name}>
        {item?.name}
      </div>
      <div>
        <div className='LibraryListItem-col LibraryListItem-metadata'>
          {item?.type}
        </div>
      </div>
    </li>
  )
}
