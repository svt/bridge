import React from 'react'
import { SharedContext } from '../../sharedContext'

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

export function FrameComponent ({ data }) {
  const [shared] = React.useContext(SharedContext)

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
    }

    const uri = shared?._widgets[data.component]?.uri

    const snapshot = JSON.stringify([data, uri])
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    setup()
  }, [data, shared])

  return (
    <div ref={wrapperRef} className='FrameComponent' />
  )
}
