import React from 'react'
import bridge from 'bridge'

import { ReferenceButton } from '../components/ReferenceButton'

export const InspectorReferenceButton = () => {
  async function handleClick () {
    const selection = await bridge.client.selection.getSelection()
    if (!selection?.[0]) {
      return
    }

    const item = await bridge.items.getItem(selection[0])
    const targetId = item?.data?.targetId
    if (!targetId) {
      return
    }

    bridge.client.selection.setSelection(targetId)
  }

  return (
    <ReferenceButton onClick={() => handleClick()} />
  )
}
