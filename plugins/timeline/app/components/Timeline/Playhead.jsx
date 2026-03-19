import React from 'react'

import './Playhead.css'

export function Playhead ({ x, ghost = false }) {
  if (x == null) {
    return null
  }

  return (
    <div
      className={`Playhead${ghost ? ' Playhead--ghost' : ''}`}
      style={{ left: `${x}px` }}
    />
  )
}
