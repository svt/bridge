const bridge = require('bridge')
const z = require('zod')

module.exports = {
  name: 'move_items',
  definition: {
    description: 'Move multiple items between rundowns and groups',
    inputSchema: {
      operations: z
        .array(
          z.object({
            itemId: z
              .string()
              .describe('The id of the item to move'),
            index: z
              .number()
              .optional()
              .describe('The index within the new parent that the item will be placed at, set to -1 to append the item'),
            newParentId: z
              .string()
              .describe('The id of the new parent rundown or group that this item will move to')
          })
            .describe('An array of move operations')
        )
    }
  },
  auth: {
    toolName: 'bridge_move_items',
    detail: {
      requiresAuth: true,
      authMessage: 'Allow agent to move items?',
      usageDescription: 'Moving items'
    }
  },
  handler: async ({ operations = [] }) => {
    if (!Array.isArray(operations)) {
      return {
        content: [{ type: 'text', text: 'Argument operations must be an array' }]
      }
    }

    const movedItems = []
    const failedMoves = []

    async function executeOperation (operation, targetIndex) {
      if (!operation?.itemId || !operation?.newParentId) {
        failedMoves.push({
          itemId: operation?.itemId,
          newParentId: operation?.newParentId,
          reason: 'Missing itemId or newParentId'
        })
        return
      }

      const itemExists = await bridge.items.itemExists(operation.itemId)
      if (!itemExists) {
        failedMoves.push({
          itemId: operation.itemId,
          newParentId: operation.newParentId,
          reason: 'Item does not exist'
        })
        return
      }

      try {
        if (targetIndex == null) {
          await bridge.commands.executeCommand('rundown.appendItem', operation.newParentId, operation.itemId)
        } else {
          await bridge.commands.executeCommand('rundown.moveItem', operation.newParentId, targetIndex, operation.itemId)
        }

        movedItems.push({
          itemId: operation.itemId,
          newParentId: operation.newParentId,
          index: operation.index
        })
      } catch (err) {
        failedMoves.push({
          itemId: operation.itemId,
          newParentId: operation.newParentId,
          reason: err?.message || 'Unknown error'
        })
      }
    }

    const enriched = operations.map((operation, originalOrder) => ({ operation, originalOrder }))
    const parentOrder = []
    const groupedByParent = {}

    for (const entry of enriched) {
      const parentId = entry?.operation?.newParentId || ''
      if (!groupedByParent[parentId]) {
        groupedByParent[parentId] = []
        parentOrder.push(parentId)
      }
      groupedByParent[parentId].push(entry)
    }

    for (const parentId of parentOrder) {
      const entries = groupedByParent[parentId]
      const indexed = []
      const append = []

      for (const entry of entries) {
        const index = entry?.operation?.index
        if (index == null || index < 0) {
          append.push(entry)
        } else {
          indexed.push(entry)
        }
      }

      indexed.sort((a, b) => {
        const aIndex = Math.max(0, Math.trunc(a.operation.index))
        const bIndex = Math.max(0, Math.trunc(b.operation.index))
        if (aIndex === bIndex) {
          return a.originalOrder - b.originalOrder
        }
        return aIndex - bIndex
      })

      let previousBaseIndex = null
      let duplicateOffset = 0
      for (const entry of indexed) {
        const baseIndex = Math.max(0, Math.trunc(entry.operation.index))
        if (baseIndex !== previousBaseIndex) {
          previousBaseIndex = baseIndex
          duplicateOffset = 0
        }

        const targetIndex = baseIndex + duplicateOffset
        duplicateOffset += 1
        await executeOperation(entry.operation, targetIndex)
      }

      for (const entry of append) {
        await executeOperation(entry.operation, null)
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ movedItems, failedMoves }) }],
      structuredContent: { movedItems, failedMoves }
    }
  }
}
