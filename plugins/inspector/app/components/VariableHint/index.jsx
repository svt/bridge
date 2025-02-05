import React from 'react'
import './style.css'

export function VariableHint ({ onClick = () => {} }) {
  return (
    <div className='VariableHint' data-hint='Insert variable' data-hint-alignment='right' onClick={() => onClick()}>VAR</div>
  )
}
