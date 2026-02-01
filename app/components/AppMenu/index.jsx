import React from 'react'
import * as api from '../../api'

import './style.css'

import { AppMenuRootItem } from './AppMenuRootItem'

import * as windowUtils from '../../utils/window'

function recursivePopulateCommandsInPlace (spec) {
  for (const item of spec) {
    if (typeof item?.command === 'string') {
      item.onClick = async () => {
        const bridge = await api.load()
        bridge.commands.executeRawCommand(item.command, windowUtils.getWindowId())
      }
    }
    if (Array.isArray(item.children)) {
      recursivePopulateCommandsInPlace(item.children)
    }
  }
}

export function AppMenu () {
  const [menu, setMenu] = React.useState()

  React.useEffect(() => {
    let bridge

    async function updateMenu () {
      if (!bridge) {
        return
      }
      const menu = await bridge.commands.executeCommand('window.getAppMenu')
      recursivePopulateCommandsInPlace(menu)
      setMenu(menu)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('didSetAuthenticationHeader', updateMenu)

      if (bridge.commands.getHeader('authentication')) {
        updateMenu()
      }
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('didSetAuthenticationHeader', updateMenu)
    }
  }, [])

  return (
    <div className='AppMenu'>
      {
        (menu || [])
          .filter(item => item?.label && item?.children?.length > 0)
          .map(item => {
            return (
              <AppMenuRootItem key={item?.label} label={item?.label} spec={item?.children} />
            )
          })
      }
    </div>
  )
}