import React from 'react'
import './style.css'

export function RundownDividerItem ({ index, item }) {
  return (
    <div className='RundownDividerItem' data-item-type={item.type}>
      <div className='RundownDividerItem-index'>
        {index}
      </div>
      <div className='RundownDividerItem-name'>
        {item?.data?.name}
      </div>
      <div className='RundownDividerItem-background' style={{ backgroundColor: item?.data?.color }} />
    </div>
  )
}
