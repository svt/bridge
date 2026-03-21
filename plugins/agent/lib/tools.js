const bridge = require('bridge')
const z = require('zod')

/**
 * Register all MCP tools on the provided
 * server and configure auth details on
 * the provided session
 *
 * @param { import('./Server') } server
 * @param { import('./Session') } session
 */
function registerTools (server, session) {
  server.mcpServer.registerTool('get_items', {
    description: 'Get a list of all items for the current project'
  }, async () => {
    const items = await bridge.state.get('items')
    return {
      content: [{ type: 'text', text: items ? JSON.stringify(items) : 'No items found' }],
      structuredContent: items || {}
    }
  })
  session.addAuthDetailForTool('bridge_get_items', {
    requiresAuth: false,
    usageDescription: 'Reading items'
  })

  server.mcpServer.registerTool('get_all_types', {
    description: 'Get a list of all types that can be used to create items, each type defines what fields an item contains using dot notation'
  }, async () => {
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
  })
  session.addAuthDetailForTool('bridge_get_all_types', {
    requiresAuth: false,
    usageDescription: 'Reading types'
  })

  server.mcpServer.registerTool('get_type_by_id', {
    description: 'Get a single type, each type defines what fields an item contains using dot notation',
    inputSchema: {
      typeId: z
        .string()
        .describe('The type id that should be looked up')
    }
  }, async ({ typeId }) => {
    const type = await bridge.types.getType(typeId)
    return {
      content: [{ type: 'text', text: JSON.stringify(type) }],
      structuredContent: type
    }
  })
  session.addAuthDetailForTool('bridge_get_type_by_id', {
    requiresAuth: false,
    usageDescription: 'Reading type by id'
  })

  server.mcpServer.registerTool('create_items_with_properties', {
    description: 'Create one or more items and optionally set data to properties',
    inputSchema: {
      items: z.array(
        z.object({
          typeId: z
            .string()
            .describe('The type id of the item to create'),
          parent: z
            .string()
            .describe('The id of the parent rundown or group of this item, defaults to RUNDOWN_ROOT'),
          properties: z.array(
            z.object({
              propertyPath: z.string().describe('The dot notation equivalent of the property to set, without the initial \'data\' part'),
              value: z.any().describe('The new value of the property')
            })
              .describe('A property that should be set of the newly created item')
          )
        })
          .describe('An object describing an item that should be created')
      )
        .describe('An array of descriptors for items that should be created')
    },
    outputSchema: z.object({
      createdItems: z.array(
        z.object({
          typeId: z.string().describe('The type id of the item that was created'),
          itemId: z.string().describe('The newly created item\'s id')
        })
      )
        .describe('An array of newly created item ids')
    })
  }, async ({ items = [] }) => {
    const out = []

    for (const item of items) {
      if (!item?.typeId) {
        continue
      }
      const itemId = await bridge.items.createItem(item.typeId, item?.data || {})

      for (const propertyOp of (item?.properties || [])) {
        if (!propertyOp?.propertyPath) {
          continue
        }
        await bridge.state.apply(`items.${itemId}.data.${propertyOp?.propertyPath}`, propertyOp?.value)
      }

      out.push({ typeId: item.typeId, itemId })
      await bridge.commands.executeCommand('rundown.appendItem', item?.parent || 'RUNDOWN_ROOT', itemId)
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(out) }],
      structuredContent: { createdItems: out }
    }
  })
  session.addAuthDetailForTool('bridge_create_items_with_properties', {
    requiresAuth: false,
    usageDescription: 'Creating item(s)'
  })

  server.mcpServer.registerTool('update_item_properties', {
    description: 'Update properties of one or many items',
    inputSchema: {
      properties: z.array(
        z.object({
          itemId: z.string().describe('The id of the item to update'),
          propertyPath: z.string().describe('The dot notation equivalent of the property to update, without the initial \'data\' part'),
          value: z.any().describe('The new value of the property')
        })
          .describe('A single property update')
      )
        .describe('An array of properties to update')
    }
  }, async ({ properties = [] }) => {
    for (const propertyOp of properties) {
      if (!propertyOp?.itemId || !propertyOp?.propertyPath) {
        continue
      }
      const itemExists = await bridge.items.itemExists(propertyOp.itemId)
      if (!itemExists) {
        return
      }
      await bridge.state.apply(`items.${propertyOp?.itemId}.data.${propertyOp?.propertyPath}`, propertyOp?.value)
    }
    return {
      content: [{ type: 'text', text: 'Success' }]
    }
  })
  session.addAuthDetailForTool('bridge_update_item_properties', {
    requiresAuth: true,
    authMessage: 'Allow agent to create items?',
    usageDescription: 'Updating item(s)'
  })

  server.mcpServer.registerTool('move_items', {
    description: 'Move multiple items between rundowns and groups',
    inputSchema: {
      operations: z
        .array(
          z.object({
            itemId: z
              .string()
              .describe('The id of the item to move'),
            index: z
              .number()
              .describe('The index within the new parent that the item will be placed at, set to -1 to append the item'),
            newParentId: z
              .string()
              .describe('The id of the new parent rundown or group that this item will move to')
          })
            .describe('An array of move operations')
        )
    }
  }, async ({ operations = [] }) => {
    if (!Array.isArray(operations)) {
      return {
        content: [{ type: 'text', text: 'Argument operations must be an array' }]
      }
    }
    for (const operation of operations) {
      if (!operation?.itemId || !operation?.newParentId) {
        continue
      }
      if (operation.index === -1) {
        await bridge.commands.executeCommand('rundown.appendItem', operation.newParentId, operation.itemId)
      } else {
        await bridge.commands.executeCommand('rundown.moveItem', operation.newParentId, operation.index || 0, operation.itemId)
      }
    }
    return {
      content: [{ type: 'text', text: 'Successfully moved items' }]
    }
  })
  session.addAuthDetailForTool('bridge_move_items', {
    requiresAuth: true,
    authMessage: 'Allow agent to move items?',
    usageDescription: 'Moving items'
  })

  server.mcpServer.registerTool('delete_items', {
    description: 'Delete multiple items by their ids',
    inputSchema: {
      itemIds: z
        .array(
          z.string().describe('The id of the item to delete')
        )
        .describe('An array of item ids to delete')
    }
  }, async ({ itemIds }) => {
    await bridge.items.deleteItems(itemIds)
    return {
      content: [{ type: 'text', text: 'Deleted items' }]
    }
  })
  session.addAuthDetailForTool('bridge_delete_items', {
    requiresAuth: true,
    authMessage: 'Allow agent to delete items?',
    usageDescription: 'Deleting items'
  })
}

module.exports = registerTools
