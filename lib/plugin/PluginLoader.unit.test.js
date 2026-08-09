// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const PluginLoader = require('./PluginLoader')
const ValidationError = require('../error/ValidationError')

const platform = require('../platform')

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

describe('isCompatibleWithCurrentOS', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('returns true when os is not defined', () => {
    const loader = new PluginLoader({ paths: ['/my/path'] })
    jest.spyOn(platform, 'getPlatform').mockReturnValue('darwin')

    expect(loader.isCompatibleWithCurrentOS({})).toBe(true)
  })

  test('supports allow-list entries', () => {
    const loader = new PluginLoader({ paths: ['/my/path'] })
    jest.spyOn(platform, 'getPlatform').mockReturnValue('darwin')

    expect(loader.isCompatibleWithCurrentOS({ os: ['darwin', 'linux'] })).toBe(true)
    expect(loader.isCompatibleWithCurrentOS({ os: ['linux', 'win32'] })).toBe(false)
  })

  test('supports deny-list entries', () => {
    const loader = new PluginLoader({ paths: ['/my/path'] })
    jest.spyOn(platform, 'getPlatform').mockReturnValue('darwin')

    expect(loader.isCompatibleWithCurrentOS({ os: ['!darwin'] })).toBe(false)
    expect(loader.isCompatibleWithCurrentOS({ os: ['!linux'] })).toBe(true)
  })

  test('supports mixed allow and deny entries with deny taking precedence', () => {
    const loader = new PluginLoader({ paths: ['/my/path'] })
    jest.spyOn(platform, 'getPlatform').mockReturnValue('darwin')

    expect(loader.isCompatibleWithCurrentOS({ os: ['darwin', '!linux'] })).toBe(true)
    expect(loader.isCompatibleWithCurrentOS({ os: ['darwin', '!darwin'] })).toBe(false)
  })
})
