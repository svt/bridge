import React from 'react'
import './style.css'

import { RundownItem } from '../RundownItem'

export function RundownTriggerItem ({ index, item }) {
  return <RundownItem index={index} item={item} icon='trigger' />
}
