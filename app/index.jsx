import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'

import * as _console from './utils/console'
_console.init()

import './index.css'

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
)