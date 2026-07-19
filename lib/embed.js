// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const EmbedError = require('./error/EmbedError')

const Logger = require('./Logger')
const logger = new Logger({ name: 'Proxy' })

/**
 * Extract and normalize values from
 * the CSP frame-ancestors directive
 *
 * @param { string } csp
 * @returns { string[] | null }
 */
function parseFrameAncestors (csp) {
  if (typeof csp !== 'string' || csp.length === 0) return null

  const directives = csp
    .split(';')
    .map(part => part.trim())
    .filter(Boolean)

  const frameAncestorsDirective = directives.find(directive => {
    return directive.toLowerCase().startsWith('frame-ancestors')
  })

  if (!frameAncestorsDirective) return null

  return frameAncestorsDirective
    .slice('frame-ancestors'.length)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(source => source.toLowerCase())
}
exports.parseFrameAncestors = parseFrameAncestors

/**
 * Determine if a target is embeddable
 * using response security headers
 *
 * @param { Record<string, string> } headers
 * @returns { boolean }
 */
function canBeEmbedded (headers) {
  const normalizedHeaders = headers || {}

  const xFrameOptions = String(normalizedHeaders['x-frame-options'] || '').trim().toLowerCase()

  /*
  DENY and SAMEORIGIN will block embedding
  in this cross-origin proxy use case
  */
  if (xFrameOptions.includes('deny')) return false
  if (xFrameOptions.includes('sameorigin')) return false

  const allowFromMatch = xFrameOptions.match(/allow-from\s+(\S+)/i)
  if (allowFromMatch) return false

  const csp = String(normalizedHeaders['content-security-policy'] || '')
  const frameAncestors = parseFrameAncestors(csp)

  if (!frameAncestors) return true
  if (frameAncestors.includes("'none'")) return false
  if (frameAncestors.includes('*')) return true

  /*
  Any explicit list of allowed ancestors is treated as non-embeddable
  since we no longer compare against an embedding origin
  */
  return false
}
exports.canBeEmbedded = canBeEmbedded

/**
 * Fetch a URL and return its response
 * headers as a plain object
 *
 * @param { string } url
 * @returns { Promise<Record<string, string>> }
 */
async function getHeaders (url) {
  try {
    const res = await fetch(url, {
      method: 'GET'
    })

    const out = {}
    for (const [key, val] of res.headers.entries()) {
      out[key] = val
    }

    return out
  } catch (err) {
    logger.warn('Failed to make preflight request to', url, err)
    throw new EmbedError('Unable to get target headers', 'ERR_PROXY_GET_HEADERS_FAILED', 400)
  }
}
exports.getHeaders = getHeaders
