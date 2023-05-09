import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../../sharedContext'

import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'

export function ContextAddMenu ({ onAdd = () => {} }) {
  const [shared] = React.useContext(SharedContext)

  async function handleClick (typeId) {
    const itemId = await bridge.items.createItem(typeId)
    onAdd(itemId)
  }

  /**
   * An object holding the different categories
   * for the types, non-duplicated
   * @type { Object.<String, any[]> }
   */
  const categories = React.useMemo(() => {
    if (!shared?._types) {
      return {}
    }
    const out = {}

    for (const type of Object.values(shared?._types)) {
      if (!type.name) {
        continue
      }
      const categoryName = type.category || type.id
      if (!out[categoryName]) {
        out[categoryName] = []
      }
      out[categoryName].push(type)
    }
    return out
  }, [shared?._types])

  return (
    <>
      {
        Object.entries(categories || {})
          .map(([id, category]) => {
            if (category.length === 1) {
              return <ContextMenuItem key={category[0].id} text={category[0].name} onClick={() => handleClick(category[0].id)} />
            }
            return (
              <ContextMenuItem key={id} text={id}>
                {
                  category.map(type =>
                    <ContextMenuItem key={type.id} text={type.name} onClick={() => handleClick(type.id)} />
                  )
                }
              </ContextMenuItem>
            )
          })
      }
    </>
  )
}
