require('./JWT')

const EC = require('./EC')
const DIController = require('../../shared/DIController')

test('sign and verify with EC', async () => {
  const JWT = DIController.main.instantiate('JWT')
  const { publicKey, privateKey } = await EC.generateKeyPair()

  const jwt = await JWT.sign({ foo: 'bar' }, privateKey, 'ES256')
  expect(typeof jwt).toBe('string')
})
