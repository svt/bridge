/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const PluginLoader = require('./PluginLoader')
const ValidationError = require('../error/ValidationError')

test('validate a valid manifest', async () => {
  const loader = new PluginLoader({ paths: ['/my/path'] })
  const manifest = {
    name: 'my-great-plugin',
    version: '1.0.0',
    engines: {
      bridge: '^1.0.0'
    }
  }
  await expect(loader.validateManifest(manifest)).resolves.toBe(true)
})

test('validate an invalid manifest', async () => {
  const loader = new PluginLoader({ paths: ['/my/path'] })
  const manifest = {
    version: '1.0.0',
    engines: {
      bridge: '^1.0.0'
    }
  }
  await expect(loader.validateManifest(manifest)).rejects.toThrow(ValidationError)
})
