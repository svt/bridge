import React from 'react'
import './style.css'

import * as Layout from '../Layout'

export function RundownVariableItem ({ index, item }) {
  return (
    <div className='RundownVariableItem' data-item-type={item.type}>
      <Layout.Spread>
        <div className='RundownVariableItem-section'>
          <div className='RundownVariableItem-index'>
            {index}
          </div>
          <div className='RundownVariableItem-name'>
            {item?.data?.name}
          </div>
        </div>
        <div className='RundownVariableItem-section'>
          <div className='RundownVariableItem-variable'>
            {item?.data?.variable?.key} = {item?.data?.variable?.value}
          </div>
        </div>
      </Layout.Spread>
    </div>
  )
}
