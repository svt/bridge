const EC = require('./EC')

test('generate key pair', async () => {
  const pair = await EC.generateKeyPair()
  expect(typeof pair.publicKey).toBe('string')
  expect(typeof pair.privateKey).toBe('string')
})
