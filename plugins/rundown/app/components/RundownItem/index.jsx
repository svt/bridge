/**
 * @typedef {{
 *  if: Boolean,
 *  name: String,
 *  bind: String
 * }} TypeProperty
 */

import React from 'react'
import bridge from 'bridge'

import objectPath from 'object-path'

import './style.css'

import { SharedContext } from '../../sharedContext'
import { useAsyncValue } from '../../hooks/useAsyncValue'

import { RundownItemProgress } from '../RundownItemProgress'

import * as Layout from '../Layout'
import { Icon } from '../Icon'

const ON_PLAY_ENUM = {
  'SELECT_NEXT_ITEM': '2',
  'PLAY_NEXT_ITEM': '1' 
}

/**
 * An index of type properties
 * used for quick returns when
 * calling getReadablePropertiesForType
 * 
 * @type {{ String: TypeProperty }}
 */
const propertyIndex = {}

/**
 * Get the readable properties
 * for a certain type
 * 
 * This function stores keeps
 * an index of the calculated properties
 * as a cache as it may be called
 * very frequently when loading
 * a rundown
 * 
 * @param { String } typeName The name of the type to calculate properties for
 * @returns { TypeProperty[] }
 */
async function getReadablePropertiesForType (typeName) {
  if (propertyIndex[typeName]) {
    return propertyIndex[typeName]
  }

  let resolve
  let reject
  const promise = new Promise((_resolve, _reject) => {
    resolve = _resolve
    reject = _reject
  })
  propertyIndex[typeName] = promise

  try {
    const type = await bridge.types.getType(typeName)
    const properties = Object.entries(type?.properties || {})
      .filter(([, spec]) => spec?.['ui.readable'])
      .map(([key, spec]) => {
        return {
          if: true,
          name: spec.name,
          bind: `data.${key}`
        }
      })

    resolve(properties)
    return properties
  } catch (err) {
    reject(err)
    throw err
  }
}

export function RundownItem ({ index, item }) {
  const [shared] = React.useContext(SharedContext)
  const [typeProperties, setTypeProperties] = React.useState([])

  const [name] = useAsyncValue(() => {
    return bridge.items.renderValue(item.id, 'data.name')
  }, [item])

  const displaySettings = shared?.plugins?.['bridge-plugin-rundown']?.settings?.display

  const properties = [
    { if: displaySettings?.id, name: 'ID', value: item?.id },
    { if: displaySettings?.type, name: 'Type', value: item?.type }
  ]

  /*
  Load specific properties
  for this type
  */
  React.useEffect(() => {
    if (!item?.type) {
      setTypeProperties([])
      return
    }
    async function loadProperties () {
      const properties = await getReadablePropertiesForType(item.type)
      setTypeProperties(properties)
    }
    loadProperties()
  }, [item?.type])

  return (
    <div className='RundownItem'>
      <Layout.Spread>
        <div className='RundownItem-section'>
          <div className='RundownItem-color' style={{ backgroundColor: item?.data?.color }} />
          <div className='RundownItem-background' style={{ backgroundColor: item?.data?.color }} />
          <div className='RundownItem-index'>
            {index}
          </div>
          <div className='RundownItem-name'>
            {name}
          </div>
          {
            displaySettings?.notes &&
            (
              <div className='RundownItem-notes'>
                {item?.data?.notes}
              </div>
            )
          }
        </div>
        <div className='RundownItem-section RundownItem-section--right'>
          {
            ([...properties, ...typeProperties])
              .filter(property => property.if)
              .map((property, i) => {
                /*
                Either read the value directly from
                the property or use its bind path
                to get it from the item object
                */
                let value = property?.value
                if (property?.bind) {
                  value = objectPath.get(item, property?.bind)
                }

                return (
                  <div className='RundownItem-property' key={i}>
                    {
                      !property.hiddenName &&
                        <div className='RundownItem-propertyName'>{property.name}:</div>
                    }
                    <div>{value}</div>
                  </div>
                )
              })
          }
        </div>
        <div className='RundownItem-section RundownItem-section--icons'>
          {
            item?.data?.onPlay === ON_PLAY_ENUM.SELECT_NEXT_ITEM &&
              <span className='RundownItem-icon'><Icon name='arrowDownSecondary' /></span>
          }
          {
            item?.data?.onPlay === ON_PLAY_ENUM.PLAY_NEXT_ITEM &&
              <span className='RundownItem-icon'><Icon name='arrowDownPlay' /></span>
          }
          {
            Object.keys(item?.issues ?? {}).length > 0 &&
              <span className='RundownItem-icon'><Icon name='warning' /></span>
          }
        </div>
      </Layout.Spread>
      <RundownItemProgress item={item} />
    </div>
  )
}
