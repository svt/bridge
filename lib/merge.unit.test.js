/**
 * @author Axel Boberg <axel.boberg@svt.se>
 * @copyright SVT Design © 2022
 */

const merge = require('./merge')

test('deep arrays', () => {
  const source = {
    foo: {
      arr: [1, 2, 3]
    }
  }

  const apply = {
    foo: {
      arr: [4, 5, 6]
    }
  }

  expect(merge.deep(source, apply)).toMatchObject({
    foo: {
      arr: [1, 2, 3, 4, 5, 6]
    }
  })
})
