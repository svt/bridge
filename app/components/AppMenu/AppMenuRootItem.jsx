import React from 'react'
import * as api from '../../api'

import './AppMenuRootItem.css'

const MENU_MARGIN_PX = 10

export function AppMenuRootItem ({ label, spec }) {
  const elRef = React.useRef()

  async function handleClick (e) {
    const bounds = e.target.getBoundingClientRect()

    const x = e.screenX - (e.clientX - bounds.x)
    const y = e.screenY - (e.clientY - bounds.y) + bounds.height + MENU_MARGIN_PX

    const bridge = await api.load()
    bridge.ui.contextMenu.open(spec, {
      x,
      y
    })
  }

  return (
    <div ref={elRef} className='AppMenuRootItem' onClick={e => handleClick(e)}>
      {label}
    </div>
  )
}