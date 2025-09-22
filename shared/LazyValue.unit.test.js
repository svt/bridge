const LazyValue = require('./LazyValue')

test('set a lazy value', () => {
  const value = new LazyValue()
  expect(value.get()).toBeUndefined()
  value.set('foo')
  expect(value.get()).toBe('foo')
})

test('await a lazy value one time', () => {
  const value = new LazyValue()
  expect(value.getLazy()).resolves.toBe('bar')
  value.set('bar')
})

test('await a lazy value multiple times', () => {
  const value = new LazyValue()
  expect(value.getLazy()).resolves.toBe('baz')
  expect(value.getLazy()).resolves.toBe('baz')
  value.set('baz')
  expect(value.getLazy()).resolves.toBe('baz')
})