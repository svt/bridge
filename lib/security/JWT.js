const DEFAULT_ISSUER = 'bridge'

/**
 * Dynamically import jose
 * as it's an ESM-only module
 * @returns { jose }
 */
function getJose () {
  return import('jose')
}

class JWT {
  static DEFAULT_ALG = 'ES256'

  static async sign (payload = {}, pkcs8, alg = 'ES256') {
    const jose = await getJose()
    const privateKey = await jose.importPKCS8(pkcs8, alg)
    const jwt = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg })
      .setIssuedAt()
      .setIssuer(DEFAULT_ISSUER)
      .sign(privateKey)

    return jwt
  }

  static async verify (token, spki, alg) {
    const jose = await getJose()
    const publicKey = await jose.importSPKI(spki, alg = 'ES256')
    const { payload, protectedHeader } = await jose.jwtVerify(token, publicKey, {
      issuer: DEFAULT_ISSUER
    })
    return { payload, header: protectedHeader }
  }
}

module.exports = JWT
