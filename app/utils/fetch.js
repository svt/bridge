// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const API_HOST = (function () {
  if (window.APP.apiHost) {
    return window.APP.apiHost
  }
  return ''
})()

export const host = API_HOST

export function api (path) {
  return window.fetch(`${API_HOST}${path}`)
}
