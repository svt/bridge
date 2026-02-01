// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

require('./variables')

const DIController = require('../shared/DIController')
const types = require('./types')

test('merge properties', () => {
  const typeAProperties = {
    foo: {
      type: 'string',
      default: 'bar'
    },
    bar: {
      type: 'number',
      default: 2
    }
  }

  const typeBProperties = {
    foo: {
      default: 'baz'
    },
    qux: {
      type: 'string',
      default: 'foo'
    }
  }

  expect(types.mergeProperties(typeAProperties, typeBProperties)).toMatchObject({
    foo: {
      type: 'string',
      default: 'baz'
    },
    bar: {
      type: 'number',
      default: 2
    },
    qux: {
      type: 'string',
      default: 'foo'
    }
  })
})
