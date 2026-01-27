import React from 'react'
import objectPath from 'object-path'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import { VerticalNavigation } from '../VerticalNavigation'
import { Preference } from './preference'

import * as Layout from '../Layout'

import appearance from './sections/appearance.json'
import shortcuts from './sections/shortcuts.json'
import sharing from './sections/sharing.json'
import general from './sections/general.json'
import state from './sections/state.json'

import './style.css'

import * as api from '../../api'

/**
 * Internal settings defined
 * by json files
 */
const INTERNAL_SETTINGS = [
  {
    title: 'System',
    items: [
      { title: 'General', items: general },
      { title: 'Appearance', items: appearance },
      { title: 'Keyboard shortcuts', items: shortcuts }
    ]
  },
  {
    title: 'Project',
    items: [      
      { title: 'State', items: state },
      { title: 'Sharing', items: sharing }
    ]
  }
]

export function Preferences ({ onClose = () => {} }) {
  const [shared, applyShared] = React.useContext(SharedContext)
  const [, applyLocal] = React.useContext(LocalContext)

  const [pluginSections, setPluginSections] = React.useState([])

  /**
   * All plugin sections
   * aggregated together
   */
  const sections = [
    ...INTERNAL_SETTINGS,
    {
      title: 'Plugins',
      items: pluginSections
    }
  ]

  const [section, setSection] = React.useState(sections[0]?.items[0])

  /*
  List plugins from the
  state whenever it's updated
  */
  React.useEffect(() => {
    function updatePluginSettings (state) {
      const pluginSections = Object.entries(state?._settings || {})
        /*
        Sort the groups alphabetically to
        always keep the same order
        */
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([groupName, settings]) => {
          return {
            title: groupName,
            items: settings
          }
        })

      setPluginSections([...pluginSections])
    }

    function onStateChange (newState, set) {
      if (!set.hasOwnProperty('_settings')) {
        return
      }
      updatePluginSettings(newState)
    }

    let bridge
    async function setup () {
      bridge = await api.load()
      bridge.events.on('state.change', onStateChange)
    }
    setup()

    return () => {
      setPluginSections([])

      if (!bridge?.events) {
        return
      }
      bridge.events.off('state.change', onStateChange)
    }
  }, [])

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
              .filter(setting => setting)
              .map(setting => {
                /*
                Compose a key that's somewhat unique but still static
                in order to prevent unnecessary re-rendering
                */
                const key = `${setting?.title}${setting?.description}${JSON.stringify(setting?.inputs)}`
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
