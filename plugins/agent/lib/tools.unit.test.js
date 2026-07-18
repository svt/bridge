// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

jest.mock('bridge', () => ({
  state: { get: jest.fn() },
  types: { getType: jest.fn() },
  items: {
    createItem: jest.fn(),
    applyItem: jest.fn(),
    itemExists: jest.fn(),
    deleteItems: jest.fn()
  },
  commands: {
    executeCommand: jest.fn()
  }
}))

const bridge = require('bridge')
const registerTools = require('./tools')

function setup () {
  const handlers = {}
  const server = {
    mcpServer: {
      registerTool: (name, _definition, handler) => {
        handlers[name] = handler
      }
    }
  }

  const session = {
    addAuthDetailForTool: jest.fn()
  }

  registerTools(server, session)
  return handlers
}

beforeEach(() => {
  jest.clearAllMocks()
})

test('create_items_with_properties awaits apply and append for each item', async () => {
  const handlers = setup()

  bridge.items.createItem
    .mockResolvedValueOnce('item-1')
    .mockResolvedValueOnce('item-2')

  const appliedPaths = []
  bridge.items.applyItem.mockImplementation(async (_itemId, path) => {
    appliedPaths.push(path)
  })

  const appendCalls = []
  bridge.commands.executeCommand.mockImplementation(async (command, parentId, itemId) => {
    appendCalls.push({ command, parentId, itemId })
  })

  const res = await handlers.create_items_with_properties({
    items: [
      {
        typeId: 'lowerthird',
        parent: 'RUNDOWN_ROOT',
        properties: [{ propertyPath: 'title', value: 'Hello' }]
      },
      {
        typeId: 'lowerthird',
        parent: 'RUNDOWN_ROOT',
        properties: [{ propertyPath: 'data.subtitle', value: 'World' }]
      }
    ]
  })

  expect(appliedPaths).toEqual(['data.title', 'data.subtitle'])
  expect(appendCalls).toEqual([
    { command: 'rundown.appendItem', parentId: 'RUNDOWN_ROOT', itemId: 'item-1' },
    { command: 'rundown.appendItem', parentId: 'RUNDOWN_ROOT', itemId: 'item-2' }
  ])
  expect(res.structuredContent.createdItems).toHaveLength(2)
  expect(res.structuredContent.failedItems).toHaveLength(0)
})

test('update_item_properties continues when one item does not exist', async () => {
  const handlers = setup()

  bridge.items.itemExists
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)

  await handlers.update_item_properties({
    properties: [
      { itemId: 'missing', propertyPath: 'title', value: 'x' },
      { itemId: 'exists', propertyPath: 'title', value: 'y' }
    ]
  })

  expect(bridge.items.applyItem).toHaveBeenCalledTimes(1)
  expect(bridge.items.applyItem).toHaveBeenCalledWith('exists', 'data.title', 'y', true)
})

test('move_items appends on missing index and reports failures', async () => {
  const handlers = setup()

  bridge.items.itemExists
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(false)

  const commandCalls = []
  bridge.commands.executeCommand.mockImplementation(async (...args) => {
    commandCalls.push(args)
  })

  const res = await handlers.move_items({
    operations: [
      { itemId: 'a', newParentId: 'p1' },
      { itemId: 'b', newParentId: 'p1', index: 2.9 },
      { itemId: 'missing', newParentId: 'p2', index: 0 }
    ]
  })

  expect(commandCalls).toEqual([
    ['rundown.moveItem', 'p1', 2, 'b'],
    ['rundown.appendItem', 'p1', 'a']
  ])

  expect(res.structuredContent.movedItems).toHaveLength(2)
  expect(res.structuredContent.failedMoves).toHaveLength(1)
  expect(res.structuredContent.failedMoves[0].reason).toEqual('Item does not exist')
})

test('move_items keeps stable order for duplicate indexes in same parent', async () => {
  const handlers = setup()

  bridge.items.itemExists
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)

  const commandCalls = []
  bridge.commands.executeCommand.mockImplementation(async (...args) => {
    commandCalls.push(args)
  })

  await handlers.move_items({
    operations: [
      { itemId: 'a', newParentId: 'p1', index: 0 },
      { itemId: 'b', newParentId: 'p1', index: 0 }
    ]
  })

  expect(commandCalls).toEqual([
    ['rundown.moveItem', 'p1', 0, 'a'],
    ['rundown.moveItem', 'p1', 1, 'b']
  ])
})

test('move_items sorts indexed operations per parent before append operations', async () => {
  const handlers = setup()

  bridge.items.itemExists
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)
    .mockResolvedValueOnce(true)

  const commandCalls = []
  bridge.commands.executeCommand.mockImplementation(async (...args) => {
    commandCalls.push(args)
  })

  await handlers.move_items({
    operations: [
      { itemId: 'append', newParentId: 'p1' },
      { itemId: 'high', newParentId: 'p1', index: 3 },
      { itemId: 'low', newParentId: 'p1', index: 0 },
      { itemId: 'middle', newParentId: 'p1', index: 1 }
    ]
  })

  expect(commandCalls).toEqual([
    ['rundown.moveItem', 'p1', 0, 'low'],
    ['rundown.moveItem', 'p1', 1, 'middle'],
    ['rundown.moveItem', 'p1', 3, 'high'],
    ['rundown.appendItem', 'p1', 'append']
  ])
})
