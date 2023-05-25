import React from 'react'
import objectPath from 'object-path'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { VerticalNavigation } from '../VerticalNavigation'
import { Preference } from './preference'

import * as Layout from '../Layout'

import appearance from './sections/appearance.json'
import shortcuts from './sections/shortcuts.json'
import general from './sections/general.json'
import state from './sections/state.json'

import './style.css'

/**
 * Internal settings defined
 * by json files
 */
const INTERNAL_SETTINGS = {
  items: [
    { title: 'General', items: general },
    { title: 'Appearance', items: appearance },
    { title: 'Keyboard shortcuts', items: shortcuts },
    { title: 'State', items: state }
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

    objectPath.set(patch, valuePath, value)
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
              .map(setting => {
                /*
                Compose a key that's somewhat unique but still static
                in order to prevent unnecessary re-rendering
                */
                const key = `${setting.title}${setting.description}${JSON.stringify(setting.inputs)}`
                return (
                  <Preference
                    key={key}
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
          Settings are applied automatically
        </div>
        <button className='Button--primary' onClick={() => handleCloseClick()}>OK</button>
      </footer>
    </div>
  )
}
