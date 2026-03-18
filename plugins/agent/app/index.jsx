import React from 'react'
import ReactDOM from 'react-dom/client'

import App from './App.jsx'

const domNode = document.getElementById('root')
const root = ReactDOM.createRoot(domNode)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
