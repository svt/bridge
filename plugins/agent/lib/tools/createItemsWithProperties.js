const bridge = require('bridge')
const z = require('zod')

const normalizeDataPath = require('./shared/normalizeDataPath')

module.exports = {
  name: 'create_items_with_properties',
  definition: {
    description: 'Create one or more items and optionally set data to properties',
    inputSchema: {
      items: z.array(
        z.object({
          typeId: z
            .string()
            .describe('The type id of the item to create'),
          parent: z
            .string()
            .optional()
            .describe('The id of the parent rundown or group of this item, defaults to RUNDOWN_ROOT'),
          properties: z.array(
            z.object({
              propertyPath: z.string().describe('The dot notation equivalent of the full path of the property to set from the item root'),
              value: z.any().describe('The new value of the property')
            })
              .describe('A property that should be set of the newly created item')
          )
            .optional()
            .default([]),
          data: z
            .record(z.string(), z.any())
            .optional()
        })
          .describe('An object describing an item that should be created')
      )
        .describe('An array of descriptors for items that should be created')
    },
    outputSchema: z.object({
      createdItems: z.array(
        z.object({
          typeId: z.string().describe('The type id of the item that was created'),
          itemId: z.string().describe('The newly created item\'s id')
        })
      )
        .describe('An array of newly created item ids'),
      failedItems: z.array(
        z.object({
          typeId: z.string().optional(),
          parent: z.string().optional(),
          reason: z.string().describe('The error that prevented this item from being created')
        })
      )
        .describe('An array of item descriptors that failed to be created')
    })
  },
  auth: {
    toolName: 'bridge_create_items_with_properties',
    detail: {
      requiresAuth: false,
      usageDescription: 'Creating item(s)'
    }
  },
  handler: async ({ items = [] }) => {
    if (!Array.isArray(items)) {
      return {
        content: [{ type: 'text', text: 'Argument items must be an array' }],
        structuredContent: { createdItems: [], failedItems: [] }
      }
    }

    const createdItems = []
    const failedItems = []

    for (const item of items) {
      if (!item?.typeId) {
        failedItems.push({ reason: 'Missing typeId' })
        continue
      }

      try {
        const itemId = await bridge.items.createItem(item.typeId, item?.data || {})

        for (const propertyOp of (item?.properties || [])) {
          if (!propertyOp?.propertyPath) {
            continue
          }

          const path = normalizeDataPath(propertyOp.propertyPath)
          await bridge.items.applyItem(itemId, path, propertyOp?.value, true)
        }

        await bridge.commands.executeCommand('rundown.appendItem', item?.parent || 'RUNDOWN_ROOT', itemId)
        createdItems.push({ typeId: item.typeId, itemId })
      } catch (err) {
        failedItems.push({
          typeId: item?.typeId,
          parent: item?.parent,
          reason: err?.message || 'Unknown error'
        })
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ createdItems, failedItems }) }],
      structuredContent: { createdItems, failedItems }
    }
  }
}
