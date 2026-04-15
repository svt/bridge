// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'XmlParser' })

/**
 * @param { string } str
 * @returns { string }
 */
function kebabToCamelCase (str) {
  return str.replace(/[-_]([a-z])/g, (_, c) => c.toUpperCase())
}

class XmlParser {
  /**
   * Parse an XML string into a plain JavaScript object.
   * Element names are converted to camelCase. Multiple sibling
   * elements with the same name become an array. Leaf elements
   * return their text content as a string.
   *
   * @param { string | undefined } xml
   * @returns { object | undefined }
   */
  static parse (xml) {
    if (!xml) {
      return undefined
    }

    const src = xml
      .replace(/<\?[\s\S]*?\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .trim()

    const pos = { i: 0 }

    function skipWs () {
      while (pos.i < src.length && /\s/.test(src[pos.i])) pos.i++
    }

    function parseTag () {
      if (src[pos.i] !== '<') return null
      pos.i++

      const isClose = src[pos.i] === '/'
      if (isClose) pos.i++

      let name = ''
      while (pos.i < src.length && /[a-zA-Z0-9_:\-.]+/.test(src[pos.i])) {
        name += src[pos.i++]
      }

      const attrs = {}
      skipWs()
      while (pos.i < src.length && src[pos.i] !== '>' && src[pos.i] !== '/') {
        let attrName = ''
        while (pos.i < src.length && /[a-zA-Z0-9_:\-.]+/.test(src[pos.i])) {
          attrName += src[pos.i++]
        }
        skipWs()
        let attrValue = null
        if (src[pos.i] === '=') {
          pos.i++
          skipWs()
          const q = src[pos.i++]
          attrValue = ''
          while (pos.i < src.length && src[pos.i] !== q) attrValue += src[pos.i++]
          pos.i++
        }
        if (attrName) attrs[kebabToCamelCase(attrName)] = attrValue ?? true
        skipWs()
      }

      const isSelfClose = src[pos.i] === '/'
      if (isSelfClose) pos.i++
      if (src[pos.i] === '>') pos.i++

      return { name, attrs, isClose, isSelfClose }
    }

    function parseElement () {
      skipWs()
      if (pos.i >= src.length) return null

      if (src[pos.i] !== '<') {
        let text = ''
        while (pos.i < src.length && src[pos.i] !== '<') text += src[pos.i++]
        return { type: 'text', value: text.trim() }
      }

      const tag = parseTag()
      if (!tag) return null
      if (tag.isClose) return { type: 'close', name: tag.name }
      if (tag.isSelfClose) {
        return { type: 'element', name: tag.name, value: Object.keys(tag.attrs).length ? tag.attrs : null }
      }

      const obj = { ...tag.attrs }
      let textContent = null

      while (pos.i < src.length) {
        skipWs()
        if (pos.i >= src.length) break

        if (src[pos.i] === '<' && src[pos.i + 1] === '/') {
          parseTag()
          break
        }

        const child = parseElement()
        if (!child || child.type === 'close') break
        if (child.type === 'text') {
          if (child.value) textContent = child.value
          continue
        }

        const key = kebabToCamelCase(child.name)
        if (obj[key] !== undefined) {
          if (!Array.isArray(obj[key])) obj[key] = [obj[key]]
          obj[key].push(child.value)
        } else {
          obj[key] = child.value
        }
      }

      const hasAttrsOrChildren = Object.keys(obj).length > 0
      const value = hasAttrsOrChildren
        ? (textContent ? { ...obj, _text: textContent } : obj)
        : (textContent ?? null)

      return { type: 'element', name: tag.name, value }
    }

    try {
      const root = parseElement()
      if (!root || root.type !== 'element') return undefined
      return { [kebabToCamelCase(root.name)]: root.value }
    } catch (err) {
      logger.warn('Failed to parse XML config: ' + err.message)
      return undefined
    }
  }
}

module.exports = XmlParser
