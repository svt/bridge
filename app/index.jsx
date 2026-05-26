import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

import * as _console from './utils/console'
_console.init()

import './index.css'

/*
Suppress the native WebView context menu so the app's own
onContextMenu handlers can render their custom popups. Without this,
WKWebView and WebView2 show a generic Inspect/Copy menu before (or
alongside) the React handler. Using capture phase keeps React's
onContextMenu callbacks running normally on the same event.
*/
if (typeof window !== 'undefined') {
  window.addEventListener('contextmenu', e => e.preventDefault(), true)
}

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)