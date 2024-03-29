import React from 'react'
import './style.css'

const DEFAULT_DURATION_MS = 5000

const DEFAULT_VALUES = {
  STILL: {
    channel: 1,
    layer: 10
  },
  MOVIE: {
    channel: 1,
    layer: 10
  },
  AUDIO: {
    channel: 1,
    layer: 30
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
   */
  const [, framerate] = item?.framerate.split('/')

  return (item?.duration / framerate) * 1000
}

export const LibraryListItem = ({ item = {} }) => {
  async function handleDragStart (e) {
    e.dataTransfer.setData('bridge/item', JSON.stringify({
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
    }))
    e.stopPropagation()
  }

  return (
    <li className='LibraryListItem' onDragStart={e => handleDragStart(e)} draggable>
      <div className='LibraryListItem-name LibraryListItem-col'>
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
