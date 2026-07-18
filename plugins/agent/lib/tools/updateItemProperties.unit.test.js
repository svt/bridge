// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const { bridge, setupHandlers } = require('./testUtils')

test('update_item_properties continues when one item does not exist', async () => {
  const handlers = setupHandlers()

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
