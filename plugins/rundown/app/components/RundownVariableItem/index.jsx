import React from 'react'
import './style.css'

import { RundownItem } from '../RundownItem'

export function RundownVariableItem ({ index, item }) {
  return <RundownItem index={index} item={item} icon='variable' />
}
