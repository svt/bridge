import React from 'react'

import './style.css'

import * as Layout from '../Layout'
import { VerticalNavigation } from '../VerticalNavigation'

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
  function handleSidebarClick (path) {
    console.log('Clicked', path)
  }

  const sidebar = (
    <div className='Preferences-sidebar'>
      <VerticalNavigation sections={NAVIGATION} onClick={handleSidebarClick} />
    </div>
  )

  return (
    <div className='Preferences u-theme--light'>
      <Layout.Master sidebar={sidebar}>
        Test
      </Layout.Master>
    </div>
  )
}
