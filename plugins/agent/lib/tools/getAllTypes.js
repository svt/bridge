const bridge = require('bridge')

module.exports = {
  name: 'get_all_types',
  definition: {
    description: 'Get a list of all types that can be used to create items, each type defines what fields an item contains using dot notation'
  },
  auth: {
    toolName: 'bridge_get_all_types',
    detail: {
      requiresAuth: false,
      usageDescription: 'Reading types'
    }
  },
  handler: async () => {
    const types = await bridge.state.get('_types')
    const rendered = []
    const structured = {}

    for (const type of Object.values(types)) {
      const render = await bridge.types.getType(type.id)
      rendered.push(render)
      structured[type.id] = render
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(rendered) }],
      structuredContent: structured
    }
  }
}
