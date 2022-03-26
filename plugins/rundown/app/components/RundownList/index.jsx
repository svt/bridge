import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

import { RundownItem } from '../RundownItem'

export function RundownList () {
  const [shared] = React.useContext(SharedContext)
  const items = shared?.plugins?.['bridge-plugin-rundown']?.items || []

  return (
    <div className='RundownList'>
      {
        items.map((item, i) => {
          return <RundownItem key={i} index={i + 1} item={item} />
        })
      }
    </div>
  )
}
