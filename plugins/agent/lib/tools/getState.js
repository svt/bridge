const bridge = require('bridge')
const z = require('zod')

module.exports = {
  name: 'get_state',
  definition: {
    description: 'Read the shared state of Bridge, prefer a specific path over the full state as it can be large',
    inputSchema: {
      path: z
        .string()
        .optional()
        .describe('A dot-notated path to a part of the state, for example "items" or "plugins.caspar". Omit to read the full state')
    }
  },
  auth: {
    toolName: 'bridge_get_state',
    detail: {
      requiresAuth: false,
      usageDescription: 'Reading state'
    }
  },
  handler: async ({ path } = {}) => {
    const state = await bridge.state.get(path)
    return {
      content: [{ type: 'text', text: state === undefined ? 'No state found' : JSON.stringify(state) }]
    }
  }
}
