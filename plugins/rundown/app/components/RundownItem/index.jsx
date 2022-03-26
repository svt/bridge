import React from 'react'
import './style.css'

export function RundownItem ({ item }) {
  return (
    <div className='RundownItem'>
      {item.id}
    </div>
  )
}
