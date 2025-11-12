const NO_CATEGORY_ID = '__none__'

function orderTypesByCategory (types) {
  const out = {}

  for (const type of Object.values(types)) {
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
}

export function generateAddContextMenuItems (types, onItemClick) {
  const categories = orderTypesByCategory(types)

  return Object.entries(categories)
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
        return category.map(type => {
          return {
            type: 'item',
            label: type.name,
            onClick: () => onItemClick(type.id)
          }
        })
      }

      /*
      Render each named
      category as a submenu
      */
      return {
        type: 'item',
        label: id,
        children: category.map(type => {
          return {
            type: 'item',
            label: type.name,
            onClick: () => onItemClick(type.id)
          }
        })
      }
    })
    .flat(1)
}
