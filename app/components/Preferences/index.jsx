import React from 'react'
import objectPath from 'object-path'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { VerticalNavigation } from '../VerticalNavigation'
import { Preference } from './preference'

import { PreferencesBooleanInput } from '../PreferencesBooleanInput'
import { PreferencesThemeInput } from '../PreferencesThemeInput'

import * as Layout from '../Layout'

import appearance from './panes/appearance.json'
import general from './panes/general.json'

import './style.css'

{ /*
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
*/ }

/**
 * Map typenames to components
 * used to render the views
 * @type { Object.<String, React.Component> }
 */
const INPUT_TYPES = {
  boolean: PreferencesBooleanInput,
  theme: PreferencesThemeInput
}

/**
 * Define the internal settings panes,
 * this should be appended by the dynamic
 * panes generated by plugins
 */
const INTERNAL_PANES = [
  {
    items: [
      { title: 'General', items: general },
      { title: 'Appearance', items: appearance }
    ]
  },
  {
    title: 'Plugins',
    items: [
      { title: 'General', items: general },
      { title: 'Appearance', items: appearance }
    ]
  }
]

export function Preferences ({ onClose = () => {} }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local, applyLocal] = React.useContext(LocalContext)

  const [pane, setPane] = React.useState(INTERNAL_PANES[0]?.items[0])

  function handleSidebarClick (path) {
    const pane = INTERNAL_PANES[path[0]]?.items[path[1]]
    setPane(pane)
  }

  function handleCloseClick () {
    onClose()
  }

  /**
   * Update the value
   * at the specified
   * path in one of
   * the contexts
   * @param {*} path
   * @param {*} value
   */
  function handleValueChange (path, value) {
    const parts = path.split('.')
    const context = parts.shift()

    const apply = (function () {
      switch (context) {
        case 'shared':
          return applyShared
        case 'local':
          return applyLocal
        default:
          return () => {}
      }
    })()

    const patch = {}
    const valuePath = parts.join('.')
    objectPath.set(patch, valuePath, value)

    apply(patch)
  }

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

  const sidebar = (
    <div className='Preferences-sidebar'>
      <VerticalNavigation sections={INTERNAL_PANES} onClick={handleSidebarClick} />
    </div>
  )

  return (
    <div className='Preferences'>
      <div className='Preferences-content'>
        <Layout.Master sidebar={sidebar}>
          {
            (pane?.items || [])
              .map((setting, i) => {
                return (
                  <Preference key={i} title={setting.title} description={setting.description}>
                    {
                      (setting.inputs || [])
                        .filter(input => INPUT_TYPES[input.type])
                        .map((input, i) => {
                          const InputComponent = INPUT_TYPES[input.type]
                          return (
                            <InputComponent
                              key={i}
                              {...input}
                              value={valueFromPath(input.bind)}
                              onChange={value => handleValueChange(input.bind, value)}
                            />
                          )
                        })
                    }
                  </Preference>
                )
              })
          }
        </Layout.Master>
      </div>
      <footer className='Preferences-footer'>
        <div>
          Settings are saved automatically
        </div>
        <button className='Button--primary' onClick={() => handleCloseClick()}>OK</button>
      </footer>
    </div>
  )
}
