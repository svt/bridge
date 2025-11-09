const EC = require('./EC')
const JWT = require('./JWT')

test('sign with EC', async () => {
  const { publicKey, privateKey } = await EC.generateKeyPair()
  const jwt = await JWT.sign({ foo: 'bar' }, privateKey, 'ES256')
  expect(typeof jwt).toBe('string')
})
