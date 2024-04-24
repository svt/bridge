import React from 'react'
import bridge from 'bridge'

import { QueryPath } from './components/QueryPath'
import { ItemButton } from './components/ItemButton'
import { ItemDropArea } from './components/ItemDropArea'

export default function App () {
  const [itemId, setItemId] = React.useState()
  const [item, setItem] = React.useState()

  React.useEffect(() => {
    const itemId = window.WIDGET_DATA?.['itemId']
    setItemId(itemId)
  }, [])

  React.useEffect(() => {
    async function getItem (itemId) {
      const item = await bridge.items.getItem(itemId)
      setItem(item)
    }
    getItem(itemId)
  }, [itemId])

  React.useEffect(() => {
    function handleItemChange (newItem) {
      if (newItem?.id !== item?.id) {
        return
      }
      setItem(newItem)
    }

    bridge.events.on('item.change', handleItemChange)
    return () => {
      bridge.events.off('item.change', handleItemChange)
    }
  }, [item])

  function handleItemChange (itemId) {
    window.WIDGET_UPDATE({
      'itemId': itemId
    })
    setItemId(itemId)
  }

  function handlePlayItem () {
    if (!itemId || !item) {
      return
    }
    bridge.items.playItem(itemId)
  }

  function handleStopItem () {
    if (!itemId || !item) {
      return
    }
    bridge.items.stopItem(itemId)
  }

  return (
    <>
      <QueryPath path='play'>
        <ItemDropArea onDrop={itemId => handleItemChange(itemId)}>
          <ItemButton label={item?.data?.name || 'Drop an item here'} color={item?.data?.color} onClick={() => handlePlayItem()} />
        </ItemDropArea>
      </QueryPath>
      <QueryPath path='stop'>
        <ItemDropArea onDrop={itemId => handleItemChange(itemId)}>
          <ItemButton label={item?.data?.name || 'Drop an item here'} color={item?.data?.color} onClick={() => handleStopItem()} />
        </ItemDropArea>
      </QueryPath>
    </>
  )
}
