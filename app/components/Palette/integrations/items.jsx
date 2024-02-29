import React from 'react'
import * as api from '../../../api'

function ItemRow ({ item }) {
  async function handleClick () {
    const bridge = await api.load()
    bridge.client.setSelection(item.id)
  }

  return (
    <div className='Palette-row--itemRow' onClick={() => handleClick()}>
      <div className='Palette-row--itemRow-background' style={{ background: item?.data?.color }} />
      <div className='Palette-row--itemRow-section'>
        { item?.data?.name || 'Unnamed' }
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
    .filter(item =>
      (item?.id || '').toLowerCase().includes(normalizedQuery) ||
      (item?.data?.name || '').toLowerCase().includes(normalizedQuery)
    )

  return items.map(item => {
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