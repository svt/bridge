import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../sharedContext'

function objToQueryString (obj = {}) {
  if (typeof obj !== 'object') {
    return
  }

  return Object.entries(obj)
    .map(([key, val]) => {
      return `${encodeURIComponent(key)}=${encodeURIComponent(val)}`
    })
    .join('&')
}

export const InspectorTarget = () => {
  const [state] = React.useContext(SharedContext)
  const [selection, setSelection] = React.useState([])
  const selectionRef = React.useRef([])

  React.useEffect(() => {
    async function updateSelection () {
      const selection = await bridge.client.selection.getSelection()
      selectionRef.current = selection
      setSelection(selection)
    }
    updateSelection()
  }, [state])

  function handleNewValue (set) {
    for (const id of selectionRef.current) {
      bridge.items.applyItem(id, set, true)
    }
  }

  async function handleButtonClick () {
    const modalId = bridge.ui.modal.makeId()
    bridge.ui.modal.open({
      id: modalId,
      uri: `${window.location.origin}${window.location.pathname}?path=library/modal&modalId=${modalId}`
    })
  }

  return (
    <>
      <div className='View--spread u-marginBottom--5px'>
        <button className='Button u-width--100pct' onClick={() => handleButtonClick()}>
          Browse files
        </button>
      </div>
    </>
  )
}
