import React from 'react'
import * as api from '../../api'

import './AppMenuRootItem.css'

const MENU_MARGIN_PX = 10

export function AppMenuRootItem ({ label, spec }) {
  const elRef = React.useRef()

  async function handleClick (e) {
    const bridge = await api.load()
    bridge.ui.contextMenu.open(spec, {
      ...bridge.ui.contextMenu.getPositionFromEvent(e)
    })
  }

  return (
    <div ref={elRef} className='AppMenuRootItem' onClick={e => handleClick(e)}>
      {label}
    </div>
  )
}