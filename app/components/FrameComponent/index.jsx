import React from 'react'

import { v4 as uuidv4 } from 'uuid'

import { LocalContext } from '../../localContext'

import { Icon } from '../Icon'

import * as shortcuts from '../../utils/shortcuts'
import * as browser from '../../utils/browser'
import * as api from '../../api'

import './style.css'

/**
 * The workspace id for
 * the current workspace
 * @type { String }
 */
const workspaceId = window.APP.workspace

const host = window.APP.address
const port = window.APP.port

/**
 * Whether or not to enable
 * Chromium webviews and use
 * them when running in Electron
 * instead of iFrames
 *
 * This currently disables
 * the api completely when
 * run on the browser
 *
 * @type { Boolean }
 */
const ENABLE_WEBVIEW = false

/**
 * Declare all theme variables
 * that should be copties to
 * the frame
 */
const COPY_THEME_VARIABLES = [
  '--base-color',
  '--base-color--accent1',
  '--base-color--accent2',
  '--base-color--accent3',
  '--base-color--grey1',
  '--base-color--grey2',
  '--base-color--grey3',
  '--base-color--shade1',
  '--base-color--shade2',
  '--base-color--shade3',
  '--base-color--shade4',
  '--base-color--alert',
  '--base-color--background',
  '--base-fontFamily--primary',
  '--base-color-type--variable',
  '--base-color--notificationColor',
  '--base-color--notificationBackground'
]

/**
 * Create a string for embedding a url as
 * a frame in the current environment
 *
 * Will render an iframe if running in a web browser
 * and a webview if running inside Electron
 * @param { String } url
 * @returns { String }
 */
function getFrameHtml (url) {
  if (ENABLE_WEBVIEW && browser.isElectron()) {
    return `<webview class='FrameComponent-frame' src='${url}' />`
  }
  return `<iframe class='FrameComponent-frame' src='${url}' />`
}

/**
 * Copy theme variables from the host
 * document to an iframe's document
 * @param { HTMLIFrameElement } iframe
 */
function copyThemeVariables (iframe, variables = COPY_THEME_VARIABLES) {
  const style = window.getComputedStyle(document.body)
  for (const variable of variables) {
    const value = style.getPropertyValue(variable)
    iframe?.contentDocument?.documentElement?.style?.setProperty(variable, value)
  }
}

export function FrameComponent ({ widgetId, uri, widgets, data, onUpdate, enableFloat = true }) {
  const [caller] = React.useState(uuidv4())
  const [local] = React.useContext(LocalContext)

  const [hasFocus, setHasFocus] = React.useState(false)

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

  const onUpdateRef = React.useRef()
  React.useEffect(() => {
    onUpdateRef.current = onUpdate
  }, [onUpdate])

  React.useEffect(() => {
    async function setup () {
      const bridge = await api.load()

      wrapperRef.current.innerHTML = getFrameHtml(uri)
      frameRef.current = wrapperRef.current.firstChild

      /*
      Shim window.require for the loaded
      iframe in order to return the api
      */
      frameRef.current.contentWindow.require = module => {
        if (module === 'bridge') {
          /*
          Shim certain api functions to add caller
          information for cleanup when the frame is 
          removed
          */
          return {
            ...bridge,
            events: bridge.events.createScope(caller)
          }
        }
        return {}
      }

      /*
      Allow the widget to update its own data
      by exposing the onUpdate function,

      this is better than letting the widget
      manage its own state as this part of the state
      is automatically garbage collected on widget
      removal
      */
      frameRef.current.contentWindow.WIDGET_UPDATE = set => {
        onUpdateRef.current(set)
      }

      /*
      Inject the widget's data
      into the window object
      */
      frameRef.current.contentWindow.WIDGET_DATA = data

      frameRef.current.onload = () => {
        /*
        Setup the theme variables
        */
        copyThemeVariables(frameRef.current)

        /*
        Add a data attribute with the platform
        to the html tag for platform-specific
        styling e.t.c.
        */
        frameRef.current.contentDocument.documentElement.dataset.platform = browser.platform()
      }
    }

    /*
    Prevent re-mounting the iframe
    unless absolutely necessary

    Without this check, the iframe would reload
    every time the user changes the layout
    */
    const snapshot = JSON.stringify([data, uri])
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [uri, data])

  /*
  Clean up all event listeners 
  added by this frame whenever
  the URI or caller changes
  */
  React.useEffect(() => {
    return async () => {
      const bridge = await api.load()
      bridge.events.removeAllListeners(caller)
      bridge.events.removeAllIntercepts(caller)
    }
  }, [caller, uri])

  /*
  Highligh the component
  if it gains focus
  */
  React.useEffect(() => {
    const contentWindow = frameRef.current?.contentWindow
    if (!contentWindow) {
      return
    }

    async function onClick () {
      const bridge = await api.load()
      bridge.ui.contextMenu.close()
    }
    contentWindow.addEventListener('click', onClick)

    async function onFocus () {
      setHasFocus(true)
      contentWindow.bridgeFrameHasFocus = true
      
      const bridge = await api.load()
      bridge.ui.contextMenu.close()
    }
    contentWindow.addEventListener('focus', onFocus)
    
    function onBlur () {
      setHasFocus(false)
      contentWindow.bridgeFrameHasFocus = false
    }
    contentWindow.addEventListener('blur', onBlur)

    return () => {
      contentWindow.removeEventListener('click', onClick)
      contentWindow.removeEventListener('focus', onFocus)
      contentWindow.removeEventListener('blur', onBlur)
    }
  }, [frameRef.current?.contentWindow])

  React.useEffect(() => {
    const contentWindow = frameRef.current?.contentWindow
    if (!contentWindow) {
      return
    }

    function onKeyDown (e) {
      shortcuts.registerKeyDown(e)
    }

    function onKeyUp (e) {
      shortcuts.registerKeyUp(e)
    }

    contentWindow.addEventListener('keydown', onKeyDown)
    contentWindow.addEventListener('keyup', onKeyUp)
    return () => {
      contentWindow.removeEventListener('keydown', onKeyDown)
      contentWindow.removeEventListener('keyup', onKeyUp)
    }
  }, [frameRef.current?.contentWindow])

  /*
  Copy the theme variables from
  the current document whenever
  its theme changes
  */
  React.useEffect(() => {
    if (!frameRef.current) return
    copyThemeVariables(frameRef.current)
  }, [local.appliedTheme])

  async function handleOpenAsWindow (widgetId) {
    const url = `http://${host}:${port}/workspaces/${workspaceId}/widgets/${widgetId}`

    if (browser.isElectron()) {
      const bridge = await api.load()
      bridge.commands.executeCommand('window.openChildWindow', url)
    } else {
      window.open(url, '_blank', {
        popup: true
      })
    }
  }

  return (
    <div className={`FrameComponent ${hasFocus ? 'is-focused' : ''}`}>
      <header className='FrameComponent-header'>
        <div>
          {widgets?.[data.component]?.name}
        </div>
        <div className='FrameComponent-headerButtons'>
          {
            enableFloat && widgets?.[data.component]?.supportsFloat &&
            <button className='FrameComponent-headerButton' onClick={() => handleOpenAsWindow(widgetId)}>
              <Icon name='float' />
            </button>
          }
        </div>
      </header>
      <div ref={wrapperRef} className='FrameComponent-wrapper' />
    </div>
  )
}
