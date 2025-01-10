const DIController = require('./DIController')

class A {
  constructor (props) {
    this.B = props.B
  }

  foo () {
    return this.B.foo()
  }
}

class B {
  foo () {
    return 'bar'
  }
}

beforeAll (() => {
  DIController.main.register('A', A, ['B'])
  DIController.main.register('B', B)
})

test('instantiate an object with a requirement', () => {
  const a = DIController.main.instantiate('A')
  expect(a.foo()).toBe('bar')
})
