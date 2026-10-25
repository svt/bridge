const bridge = require('bridge')
const z = require('zod')
const { getExposedCommands } = require('../exposedCommands')

module.exports = {
  name: 'execute_command',
  definition: {
    description: 'Execute a command and return its result, use describe_command first to see what arguments it expects',
    inputSchema: {
      commandId: z
        .string()
        .describe('The id of the command to execute'),
      args: z
        .array(z.any())
        .optional()
        .describe('The positional arguments to pass to the command, must be JSON serializable')
    }
  },
  auth: {
    toolName: 'bridge_execute_command',
    detail: {
      requiresAuth: true,
      authMessage: 'Allow agent to execute a command?',
      usageDescription: 'Executing command'
    }
  },
  handler: async ({ commandId, args = [] }) => {
    const exposed = (await getExposedCommands()).some(command => command.id === commandId)
    if (!exposed) {
      return {
        isError: true,
        content: [{ type: 'text', text: `No exposed command "${commandId}"` }]
      }
    }

    try {
      const result = await bridge.commands.executeCommand(commandId, ...args)
      return {
        content: [{ type: 'text', text: result === undefined ? 'Command executed' : JSON.stringify(result) }]
      }
    } catch (err) {
      return {
        isError: true,
        content: [{ type: 'text', text: `Command failed: ${err.message}` }]
      }
    }
  }
}
