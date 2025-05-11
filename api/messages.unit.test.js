require('./messages')

const InvalidArgumentError = require('./error/InvalidArgumentError')
const DIController = require('../shared/DIController')

let messages
beforeAll(() => {
  messages = DIController.main.instantiate('Messages', {
    Events: {
      emit: () => {}
    }
  })
})

test('catch a specification that is not the correct type', () => {
  expect(() => {
    messages.validateMessageSpec([])
  }).toThrow(InvalidArgumentError)

  expect(() => {
    messages.validateMessageSpec(undefined)
  }).toThrow(InvalidArgumentError)

  expect(() => {
    messages.validateMessageSpec('')
  }).toThrow(InvalidArgumentError)
})

test('validate a specification with text', () => {
  expect(messages.validateMessageSpec({ text: 'foo' })).toMatchObject({ text: 'foo' })
  
  expect(() => {
    messages.validateMessageSpec({ text: 1 })
  }).toThrow(InvalidArgumentError)

  expect(() => {
    messages.validateMessageSpec({ text: true })
  }).toThrow(InvalidArgumentError)

  expect(() => {
    messages.validateMessageSpec({ text: null })
  }).toThrow(InvalidArgumentError)

  expect(() => {
    messages.validateMessageSpec({})
  }).toThrow(InvalidArgumentError)
})

test('let through a specification with overrides', () => {
  expect(messages.validateMessageSpec({ text: 'foo' }, { bar: 'baz' })).toMatchObject({ text: 'foo', bar: 'baz' })
})

test('validate a specification with ttl', () => {
  expect(messages.validateMessageSpec({ text: 'foo', ttl: false })).toMatchObject({ text: 'foo', ttl: messages.defaultMessageTtlMs })
  expect(messages.validateMessageSpec({ text: 'foo', ttl: -1 })).toMatchObject({ text: 'foo', ttl: messages.defaultMessageTtlMs })
  expect(messages.validateMessageSpec({ text: 'foo', ttl: 0 })).toMatchObject({ text: 'foo', ttl: 0 })
})
