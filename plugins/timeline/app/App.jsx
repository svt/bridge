import React from 'react'
import bridge from 'bridge'

import { Timeline as TimelineComponent } from './components/Timeline'

export default function App () {
  const [selectedItems, setSelectedItems] = React.useState([])

  React.useEffect(() => {
    function handleSelection (items) {
      setSelectedItems(items)
    }
    bridge.events.on('selection', handleSelection)
    return () => bridge.events.off('selection', handleSelection)
  }, [])

  return (
    <div className='App'>
      <TimelineComponent />
    </div>
  )
}
