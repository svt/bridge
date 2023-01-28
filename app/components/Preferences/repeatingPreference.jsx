import React from 'react'
import './repeatingPreference.css'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { inputComponents } from './shared'

import objectPath from 'object-path'

export function RepeatingPreference ({ setting, onChange = () => {} }) {
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
    const sourceName = parts.shift()

    let source = local
    if (sourceName === 'shared') {
      source = shared
    }

    return objectPath.get(source, parts.join('.'))
  }

  const rawValue = valueFromPath(setting.bind)
  const instances = Array.isArray(rawValue) ? rawValue : []

  function handleAddOne () {
    onChange(setting.bind, { $push: [{}] })
  }

  function handleRemove (i) {
    onChange(setting.bind, { [i]: { $delete: true } })
  }

  return (
    <div className='Preferences-preference Preferences-repeatingPreference'>
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
      <div className='Preferences-repeatingPreferenceActions'>
        <button className='Button Button--secondary' onClick={() => handleAddOne()}>Add one</button>
      </div>
      <div className='Preferences-repeatingPreferenceInputs'>
        {
          instances
            .map((instance, i) => {
              return (
                <div key={i} className='Preferences-repeatingPreferenceInstance'>
                  {
                    (setting.inputs || [])
                      .filter(input => inputComponents[input.type])
                      .map((input, j) => {
                        const InputComponent = inputComponents[input.type]
                        const bind = `${setting.bind ? `${setting.bind}.` : ''}${i}.${input.bind ?? ''}`
                        return (
                          <InputComponent
                            key={j}
                            {...input}
                            value={bind ? valueFromPath(bind) : undefined}
                            onChange={value => onChange(bind, value)}
                          />
                        )
                      })
                  }
                  <button className='Button' onClick={() => handleRemove(i)}>Remove</button>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
