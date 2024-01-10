import React from 'react'

import { v4 as uuidv4 } from 'uuid'

import { SharedContext } from '../../sharedContext'
import { LocalContext } from '../../localContext'

import * as shortcuts from '../../utils/shortcuts'
import * as browser from '../../utils/browser'
import * as api from '../../api'

import './style.css'

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
  '--base-color--accent4',
  '--base-color--grey1',
  '--base-color--grey2',
  '--base-color--grey3',
  '--base-color--shade',
  '--base-color--shade1',
  '--base-color--shade2',
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

export function FrameComponent ({ data, onUpdate }) {
  const [callee] = React.useState(uuidv4())

  const [shared] = React.useContext(SharedContext)
  const [local] = React.useContext(LocalContext)

  const [hasFocus, setHasFocus] = React.useState(false)

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

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
          Shim certain api functions to add callee
          information for cleanup when the frame is 
          removed
          */
          return {
            ...bridge,
            events: {
              ...bridge.events,
              on: (arg0, arg1, opts = {}) => {
                return bridge.events.on(arg0, arg1, { ...opts, callee: opts.callee || callee })
              },
              once: (arg0, arg1, opts = {}) => {
                return bridge.events.once(arg0, arg1, { ...opts, callee: opts.callee || callee })
              },
              intercept: (arg0, arg1, opts = {}) => {
                return bridge.events.intercept(arg0, arg1, { ...opts, callee: opts.callee || callee })
              }
            }
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
        onUpdate(set)
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

    const uri = shared?._widgets[data.component]?.uri

    const snapshot = JSON.stringify([data, uri])
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [data, shared, onUpdate])

  /*
  Clean up all event listeners 
  added by this frame whenever
  the URI or callee changes
  */
  React.useEffect(() => {
    return async () => {
      const bridge = await api.load()
      bridge.events.removeAllListeners(callee)
      bridge.events.removeAllIntercepts(callee)
    }
  }, [callee, shared?._widgets[data.component]?.uri])

  /*
  Highligh the component
  if it gains focus
  */
  React.useEffect(() => {
    const contentWindow = frameRef.current?.contentWindow
    if (!contentWindow) {
      return
    }
    function onFocus () {
      setHasFocus(true)
    }
    contentWindow.addEventListener('focus', onFocus)

    function onBlur () {
      setHasFocus(false)
    }
    contentWindow.addEventListener('blur', onBlur)

    return () => {
      contentWindow.removeEventListener('focus', onFocus)
      contentWindow.removeEventListener('blur', onBlur)
    }
  }, [frameRef.current?.contentWindow])

  React.useEffect(() => {
    const contentWindow = frameRef.current?.contentWindow
    if (!contentWindow) {
      return
    }

    contentWindow.addEventListener('keydown', shortcuts.registerKeyDown)
    contentWindow.addEventListener('keyup', shortcuts.registerKeyUp)
    return () => {
      contentWindow.removeEventListener('keydown', shortcuts.registerKeyDown)
      contentWindow.removeEventListener('keyup', shortcuts.registerKeyUp)
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

  return (
    <div className={`FrameComponent ${hasFocus ? 'is-focused' : ''}`}>
      <header className='FrameComponent-header'>
        {shared?._widgets[data.component]?.name}
      </header>
      <div ref={wrapperRef} className='FrameComponent-wrapper' />
    </div>
  )
}
