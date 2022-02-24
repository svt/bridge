// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const ContributionLoader = require('./ContributionLoader')

test('find types', async () => {
  const loader = new ContributionLoader()
  const manifest = {
    name: 'my-great-plugin',
    version: '1.0.0',
    engines: {
      bridge: '^1.0.0'
    },
    contributes: {
      types: [
        {
          id: 'my-great-type',
          properties: [
            {
              type: 'string',
              name: 'My property',
              bind: 'myProperty'
            }
          ]
        }
      ]
    }
  }
  await expect(loader.getTypes(manifest)).toHaveLength(1)
})
