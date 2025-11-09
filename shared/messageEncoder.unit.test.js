const messageEncoder = require('./messageEncoder')

test('encode a message', () => {
  const message = {
    command: {
      arr: [1, 2, 3]
    },
    type: 'test'
  }

  expect(messageEncoder.encodeMessage(message)).toMatchObject({
    c: {
      arr: [1, 2, 3]
    },
    t: 'test'
  })
})

test('decode a message', () => {
  const message = {
    c: {
      arr: [1, 2, 3]
    },
    t: 'test'
  }

  expect(messageEncoder.decodeMessage(message)).toMatchObject({
    command: {
      arr: [1, 2, 3]
    },
    type: 'test'
  })
})

test('encode and decode a message', () => {
  const message = {
    command: {
      arr: [1, 2, 3]
    },
    args: ['foo', 'bar', 'baz'],
    type: 'test'
  }

  const encoded = messageEncoder.encodeMessage(message)
  const decoded = messageEncoder.decodeMessage(encoded)

  expect(encoded).toMatchObject({
    c: {
      arr: [1, 2, 3]
    },
    a: ['foo', 'bar', 'baz'],
    t: 'test'
  })

  expect(decoded).toMatchObject(message)
})