import React from 'react'
import objectPath from 'object-path'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { VerticalNavigation } from '../VerticalNavigation'

import { Preference } from './preference'
import { RepeatingPreference } from './repeatingPreference'

import * as Layout from '../Layout'

import appearance from './sections/appearance.json'
import general from './sections/general.json'

import './style.css'

/**
 * Internal settings defined
 * by json files
 */
const INTERNAL_SETTINGS = {
  items: [
    { title: 'General', items: general },
    { title: 'Appearance', items: appearance }
  ]
}

export function Preferences ({ onClose = () => {} }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [, applyLocal] = React.useContext(LocalContext)

  const pluginSettings = React.useRef({
    title: 'Plugins',
    items: []
  })

  /**
   * All plugin sections
   * aggregated together
   */
  const sections = [
    INTERNAL_SETTINGS,
    pluginSettings.current
  ]

  const [section, setSection] = React.useState(sections[0]?.items[0])

  /*
  Append settings from the state
  to the plugins section on component
  load
  */
  React.useEffect(() => {
    Object.entries(shared?._settings || {})
      .forEach(([groupName, settings]) => {
        pluginSettings.current.items.push({
          title: groupName,
          items: settings
        })
      })

    return () => {
      pluginSettings.current.items = []
    }
  }, [shared._settings])

  function handleSidebarClick (path) {
    const pane = sections[path[0]]?.items[path[1]]
    setSection(pane)
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

    console.log('Setting', valuePath, patch)

    objectPath.set(patch, valuePath, value)

    console.log('Patching', patch)

    apply(patch)
  }

  const sidebar = (
    <div className='Preferences-sidebar'>
      <VerticalNavigation sections={sections} onClick={handleSidebarClick} />
    </div>
  )

  return (
    <div className='Preferences'>
      <div className='Preferences-content'>
        <Layout.Master sidebar={sidebar}>
          {
            (section?.items || [])
              .map((setting, i) => {
                const Component = setting.repeating ? RepeatingPreference : Preference
                return (
                  <Component
                    key={i}
                    setting={setting}
                    onChange={handleValueChange}
                  />
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
