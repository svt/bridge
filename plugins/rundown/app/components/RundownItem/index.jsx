import React from 'react'
import './style.css'

import { SharedContext } from '../../sharedContext'

import * as Layout from '../Layout'

export function RundownItem ({ index, item }) {
  const [shared] = React.useContext(SharedContext)

  const displaySettings = shared?.plugins?.['bridge-plugin-rundown']?.settings?.display

  const properties = [
    { if: displaySettings?.id, name: 'ID', value: item.id },
    { if: displaySettings?.type, name: 'Type', value: item.type }
  ]

  return (
    <div className='RundownItem'>
      <Layout.Spread>
        <div className='RundownItem-section'>
          <div className='RundownItem-color' style={{ backgroundColor: item?.data?.color }} />
          <div className='RundownItem-index'>
            {index}
          </div>
          <div className='RundownItem-name'>
            {item.data.name}
          </div>
          {
            displaySettings?.notes &&
            (
              <div className='RundownItem-notes'>
                {item.data?.notes}
              </div>
            )
          }
        </div>
        <div className='RundownItem-section'>
          {
            properties
              .filter(property => property.if)
              .map((property, i) => (
                <div className='RundownItem-property' key={i}>
                  {
                    !property.hiddenName &&
                      <div className='RundownItem-propertyName'>{property.name}:</div>
                  }
                  <div>{property.value}</div>
                </div>
              ))
          }
        </div>
      </Layout.Spread>
    </div>
  )
}
