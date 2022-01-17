import React from 'react'

import { SharedContext } from '../../sharedContext'

import './style.css'

export function IframeComponent ({ data }) {
  const [shared, applyShared] = React.useContext(SharedContext)

  const snapshotRef = React.useRef()
  const wrapperRef = React.useRef()
  const frameRef = React.useRef()

  React.useEffect(() => {
    const snapshot = JSON.stringify(data)
    if (snapshot === snapshotRef.current) return
    snapshotRef.current = snapshot

    console.log('Iframe', data)

    function renderFrame (url) {
      return `<iframe class='IframeComponent-frame' src="${url}" />`
    }

    const url = `/plugins/${data.bundle}/components/${data.id}`

    wrapperRef.current.innerHTML = renderFrame(url)
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
    <div ref={wrapperRef} className='IframeComponent' />
  )
}
