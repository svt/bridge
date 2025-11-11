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

import pkg from '../../../package.json'

import * as objectPath from 'object-path'

import './style.css'

import { StoreContext } from '../../storeContext'
import { SharedContext } from '../../sharedContext'

import { Accordion } from '../Accordion'

import { Frame } from '../../../../../app/components/Frame'
import { Notification } from '../../../../../app/components/Notification'

import { TextInput } from '../TextInput'
import { ColorInput } from '../ColorInput'
import { SelectInput } from '../SelectInput'
import { BooleanInput } from '../BooleanInput'
import { VariableHint } from '../VariableHint'
import { VariableStringInput } from '../VariableStringInput'

const PLUGIN_NAME = pkg.name

const INPUT_COMPONENTS = {
  boolean: BooleanInput,
  string: VariableStringInput,
  color: ColorInput,
  enum: SelectInput,
  text: TextInput,
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
  const [shared] = React.useContext(SharedContext)
  const [groups, setGroups] = React.useState({})
  const [globalVariableContext, setGlobalVariableContext] = React.useState({})

  /**
   * Get all global variables when the selection
   * changes in order to populate the context and 
   * provide completions
   */
  React.useEffect(() => {
    async function get () {
      const vars = await bridge.variables.getAllVariables()
      setGlobalVariableContext(vars)
    }
    get()
  }, [store?.selection])

  /*
  Store the value that's currently being edited
  for controlled inputs to read from in order to
  avoid the delay caused by using the shared state
  directly
  */
  const [localData, setLocalData] = React.useState({})

  /**
   * A reference to the
   * first selected item
   */
  const firstItem = store?.items?.[0]

  /**
   * The context used for
   * variable suggestions
   */
  const variableContext = {this: firstItem, ...globalVariableContext}

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

      /*
      Reset the local data as
      the selection changes
      */
      setLocalData({})
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
  async function handleDataChange (path, value) {
    const data = {}
    objectPath.set(data, path, value)

    setLocalData(data)

    for (const id of store.selection) {
      await bridge.items.applyItem(id, { data })
      bridge.events.emit('item.change', id)
    }
  }

  function handleRecentColorsChange (newRecentColors) {
    let op = newRecentColors
    if (newRecentColors.length > 1) {
      op = { $replace: newRecentColors }
    }

    bridge.state.apply({
      plugins: {
        [PLUGIN_NAME]: {
          recentColors: op
        }
      }
    })
  }

  /**
   * Get the current value
   * for an object path
   * 
   * This function will prefer using the locally
   * stored value from within this component but
   * fall back to the shared state
   * 
   * @param { String } path 
   * @returns { any | undefined }
   */
  function getValue (path) {
    const localValue = objectPath.get(localData, path)

    if (localValue == null) {
      return objectPath.get(store?.items?.[0]?.data || {}, path)
    }
    return localValue
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

    function handleVariableHintClick () {
      const currentVal = getValue(property.key)
      handleDataChange(property.key, `${currentVal || ''}$(`)
    }

    return (
      <div key={id} className='Form-input' style={{ width: property['ui.width'] || '100%' }}>
        <div className='Form-inputHeader'>
          <label id={id} className='Form-inputLabel'>{property.name}</label>
          {
            property.allowsVariables &&
            <VariableHint onClick={() => handleVariableHintClick()} />
          }
        </div>
        {
          property['ui.uri']
            /**
             * @todo
             * Trigger doUpdateTheme every time the theme changes,
             * access the name of the current theme to compare?
             */
            ? <Frame src={property['ui.uri']} api={bridge} doUpdateTheme={1} />
            : (
              <div className='Form-inputValue'>
                <Component
                  htmlFor={id}
                  data={property}
                  value={getValue(property.key)}
                  variableContext={property.allowsVariables && variableContext}
                  onChange={value => handleDataChange(property.key, value)}
                />
                {
                  property['ui.unit'] && <div className='Form-inputUnit'>{property['ui.unit']}</div>
                }
              </div>
              )
        }
      </div>
    )
  }

  return (
    <div className='Form'>
      <div className='Form-header'>
        <div className='Form-headerBackground' style={{
          borderBottom: `1px solid ${getValue('color') || 'var(--base-color--shade)'}`,
          backgroundImage: `linear-gradient(transparent, ${getValue('color') || 'var(--base-color)'} 300%)`
        }} />
        <div className='Form-headerSection'>
          <ColorInput
            value={getValue('color')}
            recentColors={shared?.plugins?.[PLUGIN_NAME]?.recentColors || []}
            onChange={value => handleDataChange('color', value)}
            onChangeRecent={newRecent => handleRecentColorsChange(newRecent)}
          />
        </div>
        <div className='Form-headerSection Form-header--type'>
          {store?.items?.[0]?.type}
        </div>
      </div>
      <div className='Form-scroll'>
        <div className='Form-section'>
          <div className='Form-notifications'>
            {
              Object.values(store.items?.[0]?.issues ?? {})
                .map((issue, i) => {
                  return <Notification key={i} description={issue?.description} type='warning' icon='warning' size='small' />
                })
            }
          </div>
          <div className='Form-row'>
            <div className='Form-input'>
              <div className='Form-inputHeader'>
                <label className='Form-inputLabel'>Name</label>
                <VariableHint onClick={() => { handleDataChange('name', `${getValue('name') || ''}$(`) }}/>
              </div>
              <VariableStringInput variableContext={variableContext} value={getValue('name')} onChange={value => handleDataChange('name', value)} large />
            </div>
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
    </div>
  )
}
