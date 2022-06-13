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
 */

import React from 'react'
import bridge from 'bridge'

import * as objectPath from 'object-path'

import './style.css'

import { StoreContext } from '../../storeContext'

import { Accordion } from '../Accordion'

import { TextInput } from '../TextInput'

const INPUT_COMPONENTS = {
  string: TextInput
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
 * @returns { Any[] }
 */
function orderByGroups (properties) {
  const entries = Object.entries(properties)
  const groups = {}

  for (const entry of entries) {
    const key = entry[0]
    const prop = entry[1]

    const group = prop.group || '__primary'

    if (!groups[group]) {
      groups[group] = {
        name: group,
        properties: []
      }
    }
    groups[group].properties.push({ key, ...prop })
  }

  return Object.values(groups)
}

export function Form () {
  const [store] = React.useContext(StoreContext)
  const [groups, setGroups] = React.useState([])

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

  return (
    <div className='Form'>
      {
        groups.map((group, i) => {
          return (
            <Accordion key={i} title={group.name}>
              {
                Object.values(group.properties || {})
                  .filter(property => INPUT_COMPONENTS[property.type])
                  .map((property, i) => {
                    const Component = INPUT_COMPONENTS[property.type]
                    const id = `${group.name}_${i}`
                    return (
                      <div key={id} className='Form-input'>
                        <label id={id} className='Form-inputLabel'>{property.name}</label>
                        <Component
                          htmlFor={id}
                          value={objectPath.get(store?.items?.[0]?.data || {}, property.key)}
                          onChange={value => handleDataChange(property.key, value)}
                        />
                      </div>
                    )
                  })
              }
            </Accordion>
          )
        })
      }
    </div>
  )
}
