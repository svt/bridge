// SPDX-FileCopyrightText: 2022 Sveriges Television AB
// © 2022
//
// SPDX-License-Identifier: MIT

const StaticFileRegistry = require('./StaticFileRegistry')

test('to create file hash', () => {
  const hash = 'f5e44c40330ce54abdac1c1a7c54b403bbc339ae25779a16d5d7d3e45c1e77dc'
  expect(StaticFileRegistry.getInstance().serve('/path/to/file')).toEqual(hash)
})

test('to store file reference', () => {
  const hash = 'f5e44c40330ce54abdac1c1a7c54b403bbc339ae25779a16d5d7d3e45c1e77dc'
  StaticFileRegistry.getInstance().serve('/path/to/file')
  expect(StaticFileRegistry.getInstance()._map.has(hash)).toBeTruthy()
})

test('should stop servng file', () => {
  const hash = '7d5de2a2f389ae55218d993ca620eddd589a8fcd72b4d848c3ef5770db46c08b'
  StaticFileRegistry.getInstance().serve('/myFile')
  StaticFileRegistry.getInstance().remove(hash)
  expect(StaticFileRegistry.getInstance()._map.has(hash)).toBeFalsy()
})
