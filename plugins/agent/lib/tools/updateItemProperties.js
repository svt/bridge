const bridge = require('bridge')
const z = require('zod')

const normalizeDataPath = require('./shared/normalizeDataPath')

module.exports = {
  name: 'update_item_properties',
  definition: {
    description: 'Update properties of one or many items',
    inputSchema: {
      properties: z.array(
        z.object({
          itemId: z.string().describe('The id of the item to update'),
          propertyPath: z.string().describe('The dot notation equivalent of the property to update, from the root of the item'),
          value: z.any().describe('The new value of the property')
        })
          .describe('A single property update')
      )
        .describe('An array of properties to update')
    }
  },
  auth: {
    toolName: 'bridge_update_item_properties',
    detail: {
      requiresAuth: true,
      authMessage: 'Allow agent to update items?',
      usageDescription: 'Updating item(s)'
    }
  },
  handler: async ({ properties = [] }) => {
    for (const propertyOp of properties) {
      if (!propertyOp?.itemId || !propertyOp?.propertyPath) {
        continue
      }

      const itemExists = await bridge.items.itemExists(propertyOp.itemId)
      if (!itemExists) {
        continue
      }

      const path = normalizeDataPath(propertyOp.propertyPath)
      await bridge.items.applyItem(propertyOp?.itemId, path, propertyOp?.value, true)
    }

    return {
      content: [{ type: 'text', text: 'Success' }]
    }
  }
}
