const router = require('./router.js')

/**
 * @type { import('./router.js').Route[] }
 */
const ROUTES = [
  {
    path: '/',
    render: () => 'root'
  },
  {
    path: '/foo',
    render: () => 'foo'
  },
  {
    path: '/foo/bar',
    render: () => 'foobar'
  },
  {
    path: /^\/qux\/.+$/,
    render: () => 'qux'
  }
]

test('find routes with string paths', () => {
  expect(router.findRoute('/', ROUTES)?.render()).toBe('root')
  expect(router.findRoute('/foo', ROUTES)?.render()).toBe('foo')
  expect(router.findRoute('/foo/bar', ROUTES)?.render()).toBe('foobar')
  expect(router.findRoute('/baz', ROUTES)?.render()).toBe(undefined)
})

test('find routes with regex paths', () => {
  expect(router.findRoute('/qux', ROUTES)?.render()).toBe(undefined)
  expect(router.findRoute('/qux/foo', ROUTES)?.render()).toBe('qux')
  expect(router.findRoute('/qux/foo/bar', ROUTES)?.render()).toBe('qux')
})
