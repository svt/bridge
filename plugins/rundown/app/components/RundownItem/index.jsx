import React from 'react'
import './style.css'

export function RundownItem ({ index, item }) {
  return (
    <div className='RundownItem'>
      <div className='RundownItem-color' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownItem-index'>
        {index}
      </div>
      <div className='RundownItem-name'>
        {item.id}
      </div>
    </div>
  )
}
