import React from 'react'
import bridge from 'bridge'

import { SharedContext } from '../../sharedContext'

import { ContextMenuItem } from '../../../../../app/components/ContextMenuItem'

const NO_CATEGORY_ID = '__none__'

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
      const categoryName = type.category || NO_CATEGORY_ID
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
          /*
          Make sure items that don't belong to
          a category are rendered first
          */
          .sort((a) => a[0] === NO_CATEGORY_ID ? -1 : 1)
          .map(([id, category]) => {
            /*
            Render single items that don't
            belong to any specific category
            */
            if (id === NO_CATEGORY_ID) {
              return category.map(type => 
                <ContextMenuItem key={type.id} text={type.name} onClick={() => handleClick(type.id)} />
              )
            }

            /*
            Render categories
            as nested menus
            */
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
