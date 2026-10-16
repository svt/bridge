/**
 * Generate a tab id that is not currently in use.
 * @param { Object.<string, any> } children
 * @param { Function } createId
 * @returns { string | number }
 */
export function getUniqueTabId (children = {}, createId = () => Date.now()) {
  let id = createId()

  while (children?.[id] !== undefined) {
    id = createId()
  }

  return id
}

/**
 * Build the state update needed to duplicate a tab.
 * @param { Object } params
 * @param { string } params.id
 * @param { string[] } params.order
 * @param { Object.<string, any> } params.children
 * @param { Function } params.createId
 * @returns { null | {
 *   duplicateId: string | number,
 *   newOrder: string[],
 *   duplicatedChild: Object,
 *   nextActiveTab: string | number
 * } }
 */
export function getDuplicateTabState ({ id, order = [], children = {}, createId = () => Date.now() }) {
  const sourceTab = children?.[id]
  if (!sourceTab) {
    return null
  }

  const duplicateId = getUniqueTabId(children, createId)
  const sourceIndex = order.indexOf(id)
  const newOrder = [...order]
  const insertIndex = sourceIndex === -1 ? newOrder.length : sourceIndex + 1

  newOrder.splice(insertIndex, 0, duplicateId)

  const duplicatedChild = JSON.parse(JSON.stringify(sourceTab))

  if (typeof duplicatedChild.title === 'string' && duplicatedChild.title.length > 0) {
    duplicatedChild.title = `${duplicatedChild.title} Copy`
  }

  return {
    duplicateId,
    newOrder,
    duplicatedChild,
    nextActiveTab: duplicateId
  }
}
