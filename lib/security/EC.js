const crypto = require('node:crypto')
const util = require('node:util')

/**
 * Generate an EC key pair using
 * Bridge's default configuration
 *
 * @typedef {{
 *  publicKey: string,
 *  privateKey: string
 * }} ECKeyPair
 *
 * @returns { Promise.<ECKeyPair> }
 */
async function generateKeyPair () {
  const { publicKey, privateKey } = await util.promisify(crypto.generateKeyPair)('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  })
  return { publicKey, privateKey }
}
exports.generateKeyPair = generateKeyPair
