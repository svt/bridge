import React from 'react'

import { SharedContext } from '../../sharedContext'

import * as browser from '../../utils/browser'

import './style.css'

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
  if (browser.isElectron()) {
    return `<webview class='FrameComponent-frame' src='${url}' />`
  }
  return `<iframe class='FrameComponent-frame' src='${url}' />`
}

export function FrameComponent ({ data }) {
  const [shared, applyShared] = React.useContext(SharedContext)

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

  React.useEffect(() => {
    const snapshot = JSON.stringify(data)
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    const url = `/plugins/${data.bundle}/components/${data.id}`

    wrapperRef.current.innerHTML = getFrameHtml(url)
    frameRef.current = wrapperRef.current.firstChild
  }, [data])

  /*
  Keep the frame updated
  with the shared store
  whenever it changes
  */
  React.useEffect(() => {
    if (!frameRef.current) return
    frameRef.current.contentWindow.postMessage({
      type: 'state',
      data: shared
    }, '*')
  }, [shared])

  /*
  Listen for messages sent with PostMessage
  from the frame's window and apply any changes
  to the shared context
  */
  React.useEffect(() => {
    function handleMessage (e) {
      if (e.source !== frameRef.current?.contentWindow) return
      if (e.data.type !== 'state') return
      applyShared(e.data.data)
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  return (
    <div ref={wrapperRef} className='FrameComponent' />
  )
}
