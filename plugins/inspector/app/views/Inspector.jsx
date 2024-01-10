import React from 'react'
import bridge from 'bridge'

import { StoreContext } from '../storeContext'
import { NoSelection } from '../components/NoSelection'
import { Form } from '../components/Form'

export function Inspector () {
  const [store] = React.useContext(StoreContext)

  /*
  Handle shortcuts executed
  within the inspector
  */
  React.useEffect(() => {
    async function onShortcut (e) {
      const selection = await bridge.client.getSelection()
      switch (e.detail.id) {
        case 'bridge.rundown.play':
          selection.forEach(itemId => bridge.items.playItem(itemId))
          break
        case 'bridge.rundown.stop':
          selection.forEach(itemId => bridge.items.stopItem(itemId))
          break
      }
    }

    window.addEventListener('shortcut', onShortcut)
    return () => {
      window.removeEventListener('shortcut', onShortcut)
    }
  }, [store?.selection])

  return (
    <div className='View'>
      {
        !store?.selection?.length
          ? <NoSelection />
          : <Form />
      }
    </div>
  )
}
