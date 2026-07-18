const bridge = require('bridge')
const z = require('zod')

module.exports = {
  name: 'get_type_by_id',
  definition: {
    description: 'Get a single type, each type defines what fields an item contains using dot notation',
    inputSchema: {
      typeId: z
        .string()
        .describe('The type id that should be looked up')
    }
  },
  auth: {
    toolName: 'bridge_get_type_by_id',
    detail: {
      requiresAuth: false,
      usageDescription: 'Reading type by id'
    }
  },
  handler: async ({ typeId }) => {
    const type = await bridge.types.getType(typeId)
    return {
      content: [{ type: 'text', text: JSON.stringify(type) }],
      structuredContent: type
    }
  }
}
