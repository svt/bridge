/**
 * @typedef {{
 *  path: String | RegExp,
 *  render: Function.<JSX.Element>
 * }} Route
 */

/**
 * Try to find the first matching
 * route to a specified pathname
 * @param { String } pathname
 * @param { Route[] } routes
 * @returns { Route | undefined }
 */
function findRoute (pathname, routes) {
  for (const route of routes) {
    if (typeof route.path === 'string' && route.path === pathname) {
      return route
    }
    if (route.path instanceof RegExp && route.path.test(pathname)) {
      return route
    }
  }
}
exports.findRoute = findRoute
