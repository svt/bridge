import React from 'react'
import objectPath from 'object-path'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import * as Layout from '../Layout'
import { VerticalNavigation } from '../VerticalNavigation'
import { Notification } from '../Notification'

import { Preference } from './preference'

import { PreferencesBooleanInput } from '../PreferencesBooleanInput'

import './style.css'

const INPUT_TYPES = {
  boolean: PreferencesBooleanInput
}

const DEBUG_PANE = [
  {
    type: 'boolean',
    title: 'Setting',
    description: 'A description',
    inputs: [
      { type: 'boolean', bind: 'shared.settings.test', label: 'A checkbox' },
      { type: 'boolean', bind: 'shared.settings.test2', label: 'A second checkbox' },
      { type: 'boolean', bind: 'shared.settings.test3', label: 'A third checkbox' }
    ]
  },
  {
    type: 'divider'
  }
]

const NAVIGATION = [
  {
    items: [
      'General',
      'Appearance',
      'Keyboard shortcuts',
      'Version'
    ]
  },
  {
    label: 'Plugins',
    items: [
      'Rundown',
      'Caspar'
    ]
  }
]

export function Preferences () {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [local, applyLocal] = React.useContext(LocalContext)

  function handleSidebarClick (path) {
    console.log('Clicked', path)
  }

  /**
   * Update the value
   * at the specified path
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
      <VerticalNavigation sections={NAVIGATION} onClick={handleSidebarClick} />
    </div>
  )

  return (
    <div className='Preferences u-theme--light'>
      <Layout.Master sidebar={sidebar}>
        {
          DEBUG_PANE
            .map((preference, i) => {
              return (
                <Preference key={i} title={preference.title} description={preference.description}>
                  {
                    (preference.inputs || [])
                      .filter(input => INPUT_TYPES[input.type])
                      .map((input, i) => {
                        const InputComponent = INPUT_TYPES[preference.type]
                        return <InputComponent key={i} label={input.label} value={valueFromPath(input.bind)} onChange={value => handleValueChange(input.bind, value)} />
                      })
                  }
                </Preference>
              )
            })
        }
      </Layout.Master>
      <Notification type='warning' content='Settings are saved automatically' size='small' disableInteraction />
    </div>
  )
}
