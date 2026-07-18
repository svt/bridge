// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const { bridge, setupHandlers } = require('./testUtils')

test('move_items appends on missing index and reports failures', async () => {
  const handlers = setupHandlers()

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
  const handlers = setupHandlers()

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
  const handlers = setupHandlers()

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
