const z = require('zod')
const { getExposedCommands } = require('../exposedCommands')

module.exports = {
  name: 'search_commands',
  definition: {
    description: 'Search the commands that are available in Bridge. Returns ids and descriptions only, use describe_command to see a command\'s arguments',
    inputSchema: {
      query: z
        .string()
        .optional()
        .describe('Case-insensitive text matched against command ids and descriptions'),
      prefix: z
        .string()
        .optional()
        .describe('Only include commands whose id starts with this prefix, for example "caspar."')
    }
  },
  auth: {
    toolName: 'bridge_search_commands',
    detail: {
      requiresAuth: false,
      usageDescription: 'Searching commands'
    }
  },
  handler: async ({ query, prefix } = {}) => {
    const needle = query?.toLowerCase()

    const commands = (await getExposedCommands())
      .filter(command => !prefix || command.id.startsWith(prefix))
      .filter(command => !needle || command.id.toLowerCase().includes(needle) || command.label.toLowerCase().includes(needle) || command.description.toLowerCase().includes(needle))
      .map(({ id, label, description }) => ({ id, label, description }))

    return {
      content: [{ type: 'text', text: JSON.stringify(commands) }],
      structuredContent: { commands }
    }
  }
}
