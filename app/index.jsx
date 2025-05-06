import React from 'react'
import { createRoot } from 'react-dom/client'

import App from './App'

import * as _console from './utils/console'
_console.init()

import './index.css'

const root = createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
