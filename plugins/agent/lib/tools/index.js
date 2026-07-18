const getItems = require('./getItems')
const moveItems = require('./moveItems')
const deleteItems = require('./deleteItems')
const getAllTypes = require('./getAllTypes')
const getTypeById = require('./getTypeById')
const updateItemProperties = require('./updateItemProperties')
const createItemsWithProperties = require('./createItemsWithProperties')

/**
 * Register all MCP tools on the provided
 * server and configure auth details on
 * the provided session
 *
 * @param { import('../Server') } server
 * @param { import('../Session') } session
 */
function registerTools (server, session) {
  const tools = [
    getItems,
    getAllTypes,
    getTypeById,
    createItemsWithProperties,
    updateItemProperties,
    moveItems,
    deleteItems
  ]

  for (const tool of tools) {
    server.mcpServer.registerTool(tool.name, tool.definition, tool.handler)
    session.addAuthDetailForTool(tool.auth.toolName, tool.auth.detail)
  }
}

module.exports = registerTools
