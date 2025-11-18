import React from 'react'

import { Icon } from '../Icon'

import './HeaderWindowControls.css'

import * as api from '../../api'
import * as windowUtils from './utils'

export function HeaderWindowControls () {
  const [isMaximized, setIsMaximized] = React.useState()

  React.useEffect(() => {
    let bridge

    function onMaximize (id) {
      if (id !== windowUtils.getWindowId()) {
        return
      }
      setIsMaximized(true)
    }

    function onUnMaximize () {
      if (id !== windowUtils.getWindowId()) {
        return
      }
      setIsMaximized(false)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on('window.maximize', onMaximize)
      bridge.events.on('window.unmaximize', onUnMaximize)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('window.maximize', onMaximize)
      bridge.events.off('window.unmaximize', onUnMaximize)
    }
  }, [])

  function handleToggleMaximize () {
    setIsMaximized(current => !current)
    windowUtils.toggleMaximize()
  }

  return (
    <div className='HeaderWindowControls'>
      <button className='HeaderWindowControls-button' onClick={() => windowUtils.minimize()}>
        <Icon name='windowMinimize' color='var(--icon-color)' />
      </button>
      <button className='HeaderWindowControls-button' onClick={() => handleToggleMaximize()}>
        <Icon name={isMaximized ? 'windowRestore' : 'windowMaximize'} color='var(--icon-color)' />
      </button>
      <button className='HeaderWindowControls-button HeaderWindowControls-button--close' onClick={() => windowUtils.close()}>
        <Icon name='windowClose' color='var(--icon-color)' />
      </button>
    </div>
  )
}