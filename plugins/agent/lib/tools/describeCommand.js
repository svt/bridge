const z = require('zod')
const { getExposedCommands } = require('../exposedCommands')

module.exports = {
  name: 'describe_command',
  definition: {
    description: 'Get the description and argument schema of a single command',
    inputSchema: {
      commandId: z
        .string()
        .describe('The id of the command, as returned by search_commands')
    }
  },
  auth: {
    toolName: 'bridge_describe_command',
    detail: {
      requiresAuth: false,
      usageDescription: 'Reading command details'
    }
  },
  handler: async ({ commandId }) => {
    const command = (await getExposedCommands()).find(command => command.id === commandId)

    if (!command) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No exposed command "${commandId}"` }]
      }
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(command) }],
      structuredContent: command
    }
  }
}
