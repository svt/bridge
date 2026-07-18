const bridge = require('bridge')
const z = require('zod')

module.exports = {
  name: 'delete_items',
  definition: {
    description: 'Delete multiple items by their ids',
    inputSchema: {
      itemIds: z
        .array(
          z.string().describe('The id of the item to delete')
        )
        .describe('An array of item ids to delete')
    }
  },
  auth: {
    toolName: 'bridge_delete_items',
    detail: {
      requiresAuth: true,
      authMessage: 'Allow agent to delete items?',
      usageDescription: 'Deleting items'
    }
  },
  handler: async ({ itemIds }) => {
    await bridge.items.deleteItems(itemIds)
    return {
      content: [{ type: 'text', text: 'Deleted items' }]
    }
  }
}
