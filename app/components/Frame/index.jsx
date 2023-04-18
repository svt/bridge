import React from 'react'

import { SharedContext } from '../../sharedContext'

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
  '--base-fontFamily--primary',
  '--base-color-type--variable'
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
    return `<webview class='Frame-frame' src='${url}' />`
  }
  return `<iframe class='Frame-frame' src='${url}' />`
}

export function Frame ({ src, doUpdateTheme = 1 }) {
  const [shared] = React.useContext(SharedContext)

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

  /**
   * Copy theme variables from the host
   * document to an iframe's document
   * @param { HTMLIFrameElement } iframe
   */
  function copyThemeVariables (fromEl, iframe, variables = COPY_THEME_VARIABLES) {
    const style = window.getComputedStyle(fromEl)
    for (const variable of variables) {
      const value = style.getPropertyValue(variable)
      iframe.contentDocument.documentElement.style.setProperty(variable, value)
    }
  }

  React.useEffect(() => {
    async function setup () {
      if (!wrapperRef.current) {
        return
      }
      const bridge = await api.load()

      wrapperRef.current.innerHTML = getFrameHtml(src)
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
        copyThemeVariables(wrapperRef.current, frameRef.current)
      }
    }

    const snapshot = JSON.stringify(src)
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [src, shared])

  React.useEffect(() => {
    frameRef.current?.contentWindow.addEventListener('keydown', shortcuts.registerKeyDown)
    frameRef.current?.contentWindow.addEventListener('keyup', shortcuts.registerKeyUp)
    return () => {
      frameRef.current?.contentWindow.removeEventListener('keydown', shortcuts.registerKeyDown)
      frameRef.current?.contentWindow.removeEventListener('keyup', shortcuts.registerKeyUp)
    }
  }, [frameRef.current])

  /*
  Set the height of the frame to
  equal the height of the frame's content
  */
  React.useEffect(() => {
    let shouldResize = true
    function resize () {
      window.requestAnimationFrame(() => {
        if (!shouldResize) {
          return
        }
        if (frameRef.current) {
          frameRef.current.style.height = `${frameRef.current.contentWindow?.document?.body?.scrollHeight}px`
        }
        return resize()
      })
    }
    resize()
    return () => {
      shouldResize = false
    }
  }, [frameRef.current])

  /*
  Copy the theme variables from
  the current document whenever
  its theme changes
  */
  React.useEffect(() => {
    if (!frameRef.current) return
    if (!wrapperRef.current) return
    copyThemeVariables(wrapperRef.current, frameRef.current)
  }, [doUpdateTheme, wrapperRef.current])

  return <div ref={wrapperRef} className='Frame' />
}