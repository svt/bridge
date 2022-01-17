/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const API_HOST = (function () {
  if (window.initialState.apiHost) {
    return window.initialState.apiHost
  }
  return ''
})()

export const host = API_HOST

export function api (path) {
  return window.fetch(`${API_HOST}${path}`)
}
