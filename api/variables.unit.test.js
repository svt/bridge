// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const variables = require('./variables')

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
