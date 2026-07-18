const bridge = require('bridge')

module.exports = {
  name: 'get_items',
  definition: {
    description: 'Get a list of all items for the current project'
  },
  auth: {
    toolName: 'bridge_get_items',
    detail: {
      requiresAuth: false,
      usageDescription: 'Reading items'
    }
  },
  handler: async () => {
    const items = await bridge.state.get('items')
    return {
      content: [{ type: 'text', text: items ? JSON.stringify(items) : 'No items found' }],
      structuredContent: items || {}
    }
  }
}
