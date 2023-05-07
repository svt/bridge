/*
 * SPDX-FileCopyrightText: 2022 Sveriges Television AB
 *
 * SPDX-License-Identifier: MIT
 */

/**
 * @typedef {{
 *  name: String,
 *  type: String
 * }} TypeProperty
 *
 * @typedef {{
 *  properties: [String: TypeProperty]
 * }} Type
 *
 * @typedef {{
 *  name: String,
 *  properties: TypeProperty[]
 * }} Group
 */

import React from 'react'
import bridge from 'bridge'

import * as objectPath from 'object-path'

import './style.css'

import { StoreContext } from '../../storeContext'

import { Accordion } from '../Accordion'

import { TextInput } from '../TextInput'
import { ColorInput } from '../ColorInput'
import { StringInput } from '../StringInput'

const INPUT_COMPONENTS = {
  string: StringInput,
  color: ColorInput,
  text: TextInput
}

/**
 * Remove all duplicates from an array,
 * will return a copy of the array
 * with only one instance of each
 * value
 * @param { String[] } arr
 * @returns { String[] }
 */
function removeDuplicates (arr) {
  const dict = {}
  for (const item of arr) {
    dict[item] = true
  }
  return Object.keys(dict)
}

/**
 * Get all properties that are common
 * between all provided types
 * @param { Type[] } types
 * @returns { Object.<String, TypeProperty> }
 */
function getCommonProperties (types = []) {
  if (types.length === 0) return {}
  const properties = { ...types[0].properties }

  /*
  Loop through each of the provided types
  and make sure any keys with properties
  that don't match the name and type
  are deleted from the return object
  */
  for (let i = 1; i < types.length; i++) {
    const type = types[i]
    const keys = Object.keys(properties)

    for (const key of keys) {
      if (
        type.properties[key]?.name === properties[key]?.name &&
        type.properties[key]?.type === properties[key]?.type
      ) continue
      delete properties[key]
    }
  }

  return properties
}

/**
 * Order properties into groups
 * that are easy to render
 * @param { Object.<String, TypeProperty> } properties
 * @returns { Object.<String, Group> }
 */
function orderByGroups (properties) {
  const entries = Object.entries(properties)
  const groups = {}

  for (const entry of entries) {
    const key = entry[0]
    const prop = entry[1]

    const group = prop['ui.group'] || '_primary'

    if (!groups[group]) {
      groups[group] = {
        name: group,
        properties: []
      }
    }
    groups[group].properties.push({ key, ...prop })
  }

  return groups
}

export function Form () {
  const [store] = React.useContext(StoreContext)
  const [groups, setGroups] = React.useState({})

  /*
  Find out what the common properties
  are to sort them into groups and
  render the inputs
  */
  React.useEffect(() => {
    async function getTypes () {
      const types = store.items.map(item => item.type)
      const typesPromises = removeDuplicates(types)
        .map(type => bridge.types.getType(type))

      const typeObjects = await Promise.all(typesPromises)
      const properties = getCommonProperties(typeObjects)
      const groups = orderByGroups(properties)

      setGroups(groups)
    }
    getTypes()
  }, [store.selection])

  /**
   * Update the state with new
   * values for all selected items
   * @param { String } path The data path to set
   * @param { Any } value The value to set
   */
  function handleDataChange (path, value) {
    const data = {}
    objectPath.set(data, path, value)
    for (const id of store.selection) {
      bridge.items.applyItem(id, { data })
    }
  }

  function getValue (key) {
    return objectPath.get(store?.items?.[0]?.data || {}, key)
  }

  /**
   * Render a property
   * @param { TypeProperty } property
   * @param { String } id A unique identifier to
   *                      use as the html tag's id
   * @returns { import('react').ReactElement }
   */
  function renderProperty (property, id) {
    const Component = INPUT_COMPONENTS[property.type]
    return (
      <div key={id} className='Form-input'>
        <div className='Form-inputHeader'>
          <label id={id} className='Form-inputLabel'>{property.name}</label>
        </div>
        <div className='Form-inputValue'>
          <Component
            htmlFor={id}
            value={getValue(property.key)}
            onChange={value => handleDataChange(property.key, value)}
          />
          {
            property['ui.unit'] && <div className='Form-inputUnit'>{property['ui.unit']}</div>
          }
        </div>
      </div>
    )
  }

  return (
    <div className='Form'>
      <div className='Form-section'>
        <div className='Form-row'>
          <ColorInput value={getValue('color')} onChange={value => handleDataChange('color', value)} />
          <StringInput value={getValue('name')} onChange={value => handleDataChange('name', value)} large />
        </div>
        <div className='Form-row'>
          <div className='Form-input'>
            <label className='Form-inputLabel'>Notes</label>
            <TextInput value={getValue('notes')} onChange={value => handleDataChange('notes', value)} />
          </div>
        </div>
        <div className='Form-row'>
          <div className='Form-input'>
            <label className='Form-inputLabel'>ID</label>
            <label className='Form-inputLabel u-textTransform--none u-selectable'>
              {
                (store.items || []).length > 1
                  ? 'Multiple items selected'
                  : store.items?.[0]?.id
              }
            </label>
          </div>
        </div>
      </div>
      <div className='Form-section'>
        {
          Object.values(groups)
            /*
            Don't render the primary group
            as its controls will be rendered
            above the accordions
            */
            .filter(group => group.name !== '_primary')
            .map((group, i) => {
              return (
                <div key={i} className='Form-accordion'>
                  <Accordion title={group.name}>
                    {
                      Object.values(group.properties || {})
                        .filter(property => INPUT_COMPONENTS[property.type])
                        .map((property, i) => {
                          const id = `${group.name}_${i}`
                          return renderProperty(property, id)
                        })
                    }
                  </Accordion>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
