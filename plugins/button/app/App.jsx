import React from 'react'
import bridge from 'bridge'

import { QueryPath } from './components/QueryPath'
import { ItemButton } from './components/ItemButton'
import { ItemDropArea } from './components/ItemDropArea'

/**
 * Get the label to display in a button
 * for an item or non-item
 *
 * @param { any } item 
 * @returns { Promise.<String> }
 */
async function getLabel (item) {
  if (!item) {
    return 'Drop an item here'
  }

  if (!item?.data?.name) {
    return 'Unnamed'
  }

  if (!bridge.variables.stringContainsVariable(item?.data?.name)) {
    return item?.data?.name
  }

  return await bridge.items.renderValue(item.id, 'data.name')
}

export default function App () {
  const [itemId, setItemId] = React.useState()
  const [label, setLabel] = React.useState()
  const [item, setItem] = React.useState()

  React.useEffect(() => {
    const itemId = window.WIDGET_DATA?.['itemId']
    setItemId(itemId)
  }, [])

  React.useEffect(() => {
    if (!itemId) {
      return
    }

    async function getItem (itemId) {
      const item = await bridge.items.getItem(itemId)
      setItem(item)
    }
    getItem(itemId)
  }, [itemId])

  React.useEffect(() => {
    function handleItemChange (_, newItem) {
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

  React.useEffect(() => {
    async function render () {
      const label = await getLabel(item)
      setLabel(label)
    }
    render()
  }, [itemId, item])

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
          <ItemButton label={label} color={item?.data?.color} onClick={() => handlePlayItem()} />
        </ItemDropArea>
      </QueryPath>
      <QueryPath path='stop'>
        <ItemDropArea onDrop={itemId => handleItemChange(itemId)}>
          <ItemButton label={label} color={item?.data?.color} onClick={() => handleStopItem()} />
        </ItemDropArea>
      </QueryPath>
    </>
  )
}
