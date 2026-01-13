import React from 'react'
import './preference.css'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { inputComponents } from './shared'

import objectPath from 'object-path'

export function Preference ({ setting, values, onChange = () => {} }) {
  const [shared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  /**
   * A helper function for getting the value
   * from a path that either starts with
   * 'shared' or 'local' - denoting the context
   * to get data from
   * @param { String } path
   * @returns { Any }
   */
  function valueFromPath (path) {
    const parts = path.split('.')
    const firstKey = parts.shift()

    let source = values || local

    if (parts.length === 0) {
      return source[firstKey]
    }

    if (firstKey === 'shared') {
      source = shared
    }

    return objectPath.get(source, parts.join('.'))
  }

  return (
    <div className='Preferences-preference'>
      {
        setting.title
          ? <h3 className='Preferences-preferenceTitle'>{setting.title}</h3>
          : <></>
      }
      {
        setting.description
          ? (
            <label className='Preferences-preferenceDescription'>
              {setting.description}
            </label>
            )
          : <></>
      }
      {
        (setting.inputs || [])
          .filter(input => inputComponents[input.type])
          .map((input, i) => {
            const InputComponent = inputComponents[input.type]
            const bind = `${setting.bind ? `${setting.bind}.` : ''}${input.bind ?? ''}`
            return (
              <InputComponent
                key={i}
                {...input}
                value={bind ? valueFromPath(bind) : undefined}
                onChange={value => onChange(bind, value)}
              />
            )
          })
      }
    </div>
  )
}
