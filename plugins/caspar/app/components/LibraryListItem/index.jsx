import React from 'react'
import './style.css'

import * as asset from '../../utils/asset.js'

const DEFAULT_VALUES = {
  [asset.type.still]: {
    channel: 1,
    layer: 10
  },
  [asset.type.video]: {
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
    if: item => [asset.type.still, asset.type.video, asset.type.audio].includes(item.type),
    fn: item => {
      return {
        type: 'bridge.caspar.media',
        data: {
          name: item.name,
          caspar: {
            server: item?._filter?.serverId,
            target: item.name,
            frameRate: asset.frameRateFractionToDecimalRounded(item?.framerate || asset.DEFAULT_FRAMERATE_FRACTION),
            ...(DEFAULT_VALUES[item.type] || {})
          },
          duration: asset.calculateDurationMs(item)
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
 * @typedef { import('../../utils/asset.js').LibraryAsset } LibraryAsset
 *
 * @param {{
 *  item: LibraryAsset
 * }} arg0
 */
export const LibraryListItem = ({ item = {}, isHighlighted, isFocused, itemRef, onClick, onDoubleClick }) => {
  async function handleDragStart (e) {
    const data = constructPlayableItemInit(item)
    e.dataTransfer.setData('bridge/item', JSON.stringify(data))
    e.stopPropagation()
  }

  function handleClick () {
    const data = constructPlayableItemInit(item)
    onClick?.(data)
  }

  function handleDoubleClick () {
    const data = constructPlayableItemInit(item)
    onDoubleClick?.(data)
  }

  return (
    <li
      ref={itemRef}
      className={`LibraryListItem${isHighlighted ? ' is-highlighted' : ''}${isFocused ? ' is-focused' : ''}`}
      onDragStart={e => handleDragStart(e)}
      onClick={e => handleClick(e)}
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
