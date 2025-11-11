import React from 'react'

import { TimelineTrack } from './TimelineTrack'
import { TimelineHeader } from './TimelineHeader'

import * as utils from './utils'

import './style.css'
import './colors.css'

const DUMMY_DATA = [
  {
    id: '1',
    label: 'Item 1',
    color: '#6E2276',
    duration: 1000,
    delay: 500
  },
  {
    id: '2',
    label: 'Item 2',
    color: '#421C7F',
    duration: 5000,
    delay: 0
  },
  {
    id: '3',
    label: 'Item 3',
    color: '#008092',
    duration: 3000,
    delay: 1000
  },
  {
    id: '4',
    label: 'Item 4',
    color: '#008092',
    duration: 3000,
    delay: 1000
  }
]

export function Timeline ({ items = DUMMY_DATA }) {
  const [spec, setSpec] = React.useState({})

  React.useEffect(() => {
    setSpec(utils.getTimelineSpec(items))
  }, [items])

  /*
  Allow zooming by using
  the alt-key and scrolling
  */
  function handleWheel (e) {
    if (!e.altKey) {
      return
    }

    setSpec(current => {
      return {
        ...current,
        scale: current.scale + e.deltaY * -0.05
      }
    })
  }

  return (
    <div className='Timeline' onWheel={e => handleWheel(e)}>
      <TimelineHeader spec={spec} />
      {
        items.map((item, i) => {
          return (
            <TimelineTrack key={item.id || i} spec={spec} item={item} />
          )
        })
      }
    </div>
  )
}