import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

export function RundownItem ({ index, item }) {
  const [shared] = React.useContext(SharedContext)

  const displaySettings = shared?.plugins?.['bridge-plugin-rundown']?.settings?.display

  const properties = [
    { if: displaySettings?.id, name: 'ID', value: item.id },
    { if: displaySettings?.name, name: 'Name', value: item.name },
    { if: displaySettings?.type, name: 'Type', value: item.type }
  ]

  return (
    <div className='RundownItem'>
      <div className='RundownItem-color' style={{ backgroundColor: item?.data?.color }} />
      <div className='RundownItem-index'>
        {index}
      </div>
      {
        properties
          .filter(property => property.if)
          .map((property, i) => (
            <div className='RundownItem-property' key={i}>
              <div className='RundownItem-propertyName'>{property.name}:</div>
              <div>{property.value}</div>
            </div>
          ))
      }
    </div>
  )
}
