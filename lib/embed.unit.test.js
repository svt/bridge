// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const embed = require('./embed')

test('parseFrameAncestors should return null for missing directive', () => {
  expect(embed.parseFrameAncestors('default-src \'self\''))
    .toBeNull()
})

test('parseFrameAncestors should parse and normalize sources', () => {
  const csp = "default-src 'self'; frame-ancestors 'SELF' HTTPS://Example.com *"

  expect(embed.parseFrameAncestors(csp))
    .toEqual(["'self'", 'https://example.com', '*'])
})

test('canBeEmbedded should allow when no blocking headers are present', () => {
  expect(embed.canBeEmbedded({})).toBe(true)
})

test('canBeEmbedded should block x-frame-options deny', () => {
  expect(embed.canBeEmbedded({
    'x-frame-options': 'DENY'
  })).toBe(false)
})

test('canBeEmbedded should block x-frame-options sameorigin', () => {
  expect(embed.canBeEmbedded({
    'x-frame-options': 'SAMEORIGIN'
  })).toBe(false)
})

test('canBeEmbedded should block x-frame-options allow-from', () => {
  expect(embed.canBeEmbedded({
    'x-frame-options': 'ALLOW-FROM https://example.com'
  })).toBe(false)
})

test('canBeEmbedded should block frame-ancestors none', () => {
  expect(embed.canBeEmbedded({
    'content-security-policy': "frame-ancestors 'none'"
  })).toBe(false)
})

test('canBeEmbedded should allow frame-ancestors wildcard', () => {
  expect(embed.canBeEmbedded({
    'content-security-policy': "default-src 'self'; frame-ancestors *"
  })).toBe(true)
})

test('canBeEmbedded should block explicit frame-ancestors list', () => {
  expect(embed.canBeEmbedded({
    'content-security-policy': "frame-ancestors 'self' https://example.com"
  })).toBe(false)
})
