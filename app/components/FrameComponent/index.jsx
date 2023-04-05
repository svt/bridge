import React from 'react'

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
  '--base-color--background',
  '--base-fontFamily--primary'
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
    iframe.contentDocument.documentElement.style.setProperty(variable, value)
  }
}

export function FrameComponent ({ data }) {
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
        if (module === 'bridge') return bridge
        return {}
      }

      frameRef.current.onload = () => {
        /*
        Setup the theme variables
        */
        copyThemeVariables(frameRef.current)
      }
    }

    const uri = shared?._widgets[data.component]?.uri

    const snapshot = JSON.stringify([data, uri])
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [data, shared])

  /*
  Highligh the component
  if it gains focus
  */
  React.useEffect(() => {
    function onFocus () {
      setHasFocus(true)
    }
    frameRef.current?.contentWindow.addEventListener('focus', onFocus)

    function onBlur () {
      setHasFocus(false)
    }
    frameRef.current?.contentWindow.addEventListener('blur', onBlur)

    return () => {
      frameRef.current?.contentWindow.removeEventListener('focus', onFocus)
      frameRef.current?.contentWindow.removeEventListener('blur', onBlur)
    }
  }, [frameRef.current])

  React.useEffect(() => {
    frameRef.current?.contentWindow.addEventListener('keydown', shortcuts.registerKeyDown)
    frameRef.current?.contentWindow.addEventListener('keyup', shortcuts.registerKeyUp)
    return () => {
      frameRef.current?.contentWindow.removeEventListener('keydown', shortcuts.registerKeyDown)
      frameRef.current?.contentWindow.removeEventListener('keyup', shortcuts.registerKeyUp)
    }
  }, [frameRef.current])

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
