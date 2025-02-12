// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

require('./variables')

const DIController = require('../shared/DIController')

let variables
beforeAll(() => {
  variables = DIController.main.instantiate('Variables', {
    State: {},
    Commands: {}
  })
})

test('substitutes variables in a string', () => {
  const str = 'This is a $(var 1) with multiple $(var2)'
  const data = { 'var 1': 'string', var2: 'variables' }
  expect(variables.substituteInString(str, data)).toEqual('This is a string with multiple variables')
})

test('substitutes variables in a string without spaces', () => {
  const str = '$(foo)$(bar)'
  const data = { foo: 'Hello', bar: 'World' }
  expect(variables.substituteInString(str, data)).toEqual('HelloWorld')
})

test('check if a string contains one or more variables', () => {
  const str1 = '$(foo)$(bar)'
  const str2 = 'Hello World'
  const nonString = 23
  expect(variables.stringContainsVariable(str1)).toEqual(true)
  expect(variables.stringContainsVariable(str2)).toEqual(false)
  expect(variables.stringContainsVariable(nonString)).toEqual(false)
})
