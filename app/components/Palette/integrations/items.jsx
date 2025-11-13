import React from 'react'
import * as api from '../../../api'

function ItemRow ({ item }) {
  const elRef = React.useRef()

  async function handleClick () {
    const bridge = await api.load()
    bridge.client.selection.setSelection(item.id, { caller: 'palette' })
  }

  React.useEffect(() => {
    async function onShortcut (shortcut) {
      /*
      Check if the parent row is focused,
      otherwise the shortcut shouldn't be
      performed
      */
      if (document.activeElement !== elRef.current?.parentElement) {
        return
      }

      const bridge = await api.load()

      switch (shortcut) {
        case 'play':
          bridge.items.playItem(item.id)
          break
        case 'stop':
          bridge.items.stopItem(item.id)
          break
      }
    }

    let bridge
    async function setup () {
      bridge = await api.load()
      bridge.events.on('shortcut', onShortcut)
    }
    setup()

    return () => {
      if (!bridge) {
        return
      }
      bridge.events.off('shortcut', onShortcut)
    }
  }, [item])

  return (
    <div ref={elRef} className='Palette-row--itemRow' onClick={() => handleClick()}>
      <div className='Palette-row--itemRow-background' style={{ background: item?.data?.color }} />
      <div className='Palette-row--itemRow-section'>
        { item?._renderedName || item?.data?.name || 'Unnamed' }
      </div>
      <div className='Palette-row--itemRow-section'>
        ID: { item?.id }
      </div>
    </div>
  )
}

/**
 * Render elements
 * from a query
 * @param { String } query 
 * @returns 
 */
async function getItems (query) {
  const normalizedQuery = query.toLowerCase()

  const bridge = await api.load()
  const items = Object.values(bridge.state.getLocalState()?.items || {})

  /*
  Render the names of items that contain variables
  as those should be searchable too
  */
  for (const item of items) {
    if (!bridge.variables.stringContainsVariable(item?.data?.name)) {
      continue
    }
    item._renderedName = await bridge.items.renderValue(item.id, 'data.name')
  }

  return items
    .filter(item =>
      (item?.id || '').toLowerCase().includes(normalizedQuery) ||
      (item?.data?.name || '').toLowerCase().includes(normalizedQuery) || 
      (item?._renderedName || '').toLowerCase().includes(normalizedQuery)
    )
    .map(item => {
      return <ItemRow key={item?.id} item={item} />
    })
}

/**
 * Export the integration definition
 *
 * @type {{
 *  label: String,
 *  get: () => React.Component[]
 * }}
 */
export default {
  label: 'Items',
  get: ({ query }) => getItems(query)
}