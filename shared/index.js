// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/*
Expose the shared utils as window.bridge
if we're running in a browser
*/
if (typeof window !== 'undefined') {
  window.shared = {
    merge: require('./merge')
  }
}
