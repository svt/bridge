import React from 'react'
import './style.css'

export function RundownItem ({ index, item }) {
  return (
    <div className='RundownItem'>
      <div className='RundownItem-index'>
        {index}
      </div>
      <div className='RundownItem-name'>
        {item.name}
      </div>
    </div>
  )
}
