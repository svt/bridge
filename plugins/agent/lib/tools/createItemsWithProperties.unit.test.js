// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const { bridge, setupHandlers } = require('./testUtils')

test('create_items_with_properties awaits apply and append for each item', async () => {
  const handlers = setupHandlers()

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
