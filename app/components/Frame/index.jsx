import React from 'react'

import * as shortcuts from '../../utils/shortcuts'
import * as browser from '../../utils/browser'

import { v4 as uuidv4 } from 'uuid'

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
    return `<webview class='Frame-frame' src='${url}' />`
  }
  return `<iframe class='Frame-frame' src='${url}' height='0' />`
}

/**
 * Copy theme variables from the host
 * document to an iframe's document
 * @param { HTMLIFrameElement } iframe
 */
function copyThemeVariables (fromEl, iframe, variables = COPY_THEME_VARIABLES) {
  const style = window.getComputedStyle(fromEl)
  for (const variable of variables) {
    const value = style.getPropertyValue(variable)
    iframe?.contentDocument?.documentElement?.style?.setProperty(variable, value)
  }
}

export function Frame ({ src, api, doUpdateTheme = 1 }) {
  const [callee] = React.useState(uuidv4())

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

  React.useEffect(() => {
    async function setup () {
      if (!wrapperRef.current) {
        return
      }

      wrapperRef.current.innerHTML = getFrameHtml(src)
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
            ...api,
            events: {
              ...api.events,
              on: (arg0, arg1, opts = {}) => {
                return api.events.on(arg0, arg1, { ...opts, callee: opts.callee || callee })
              },
              once: (arg0, arg1, opts = {}) => {
                return api.events.once(arg0, arg1, { ...opts, callee: opts.callee || callee })
              },
              intercept: (arg0, arg1, opts = {}) => {
                return api.events.intercept(arg0, arg1, { ...opts, callee: opts.callee || callee })
              }
            }
          }
        }
        return {}
      }

      frameRef.current.onload = () => {
        /*
        Setup the theme variables
        */
        copyThemeVariables(wrapperRef.current, frameRef.current)

        /*
        Add a data attribute with the platform
        to the html tag for platform-specific
        styling e.t.c.
        */
        frameRef.current.contentDocument.documentElement.dataset.platform = browser.platform()
      }
    }

    const snapshot = JSON.stringify(src)
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [src, api, wrapperRef.current])

  /*
  Clean up all event listeners 
  added by this frame
  */
  React.useEffect(() => {
    return () => {
      api.events.removeAllListeners(callee)
      api.events.removeAllIntercepts(callee)
    }
  }, [callee])

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
        const newHeight = `${frameRef.current.contentWindow?.document?.body?.scrollHeight}px`
        if (frameRef.current && frameRef.current.style.height !== newHeight) {
          frameRef.current.style.height = newHeight
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
