const tabs = require('./tabs')

test('getUniqueTabId should skip ids that already exist', () => {
  const existing = {
    '12345': {},
    '67890': {}
  }

  const ids = ['12345', '67890', '11111']
  const createId = () => ids.shift()

  expect(tabs.getUniqueTabId(existing, createId)).toBe('11111')
})

test('getDuplicateTabState should duplicate content and place tab after source', () => {
  const state = tabs.getDuplicateTabState({
    id: 'a',
    order: ['a', 'b'],
    children: {
      a: {
        title: 'Program',
        component: 'bridge.internals.grid',
        nested: { value: 1 }
      },
      b: {
        title: 'Preview',
        component: 'bridge.internals.grid'
      }
    },
    createId: () => 'c'
  })

  expect(state).not.toBeNull()
  expect(state.duplicateId).toBe('c')
  expect(state.nextActiveTab).toBe('c')
  expect(state.newOrder).toEqual(['a', 'c', 'b'])
  expect(state.duplicatedChild).toEqual({
    title: 'Program Copy',
    component: 'bridge.internals.grid',
    nested: { value: 1 }
  })
})

test('getDuplicateTabState should deep clone duplicated child', () => {
  const originalChild = {
    title: 'Graphics',
    nested: {
      value: 1
    }
  }

  const state = tabs.getDuplicateTabState({
    id: 'a',
    order: ['a'],
    children: { a: originalChild },
    createId: () => 'x'
  })

  state.duplicatedChild.nested.value = 99

  expect(originalChild.nested.value).toBe(1)
})

test('getDuplicateTabState should return null when source tab is missing', () => {
  const state = tabs.getDuplicateTabState({
    id: 'missing',
    order: ['a'],
    children: {
      a: { title: 'A' }
    },
    createId: () => 'x'
  })

  expect(state).toBeNull()
})
