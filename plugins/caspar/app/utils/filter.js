/**
 * @typedef {
 *  'video' | 'styill' | 'audio' | 'template'
 * } TypeFilterSingleType
 */

export const ALL_TYPES_STR = 'video,audio,still,template'
export const DEFAULT_TYPES_STR = ALL_TYPES_STR

export const TYPE_DELIMITER_STR = ','

export function getTypesFromStr (typeFilterString) {
  if (typeof typeFilterString !== 'string') {
    throw new Error('Provided filter must be valid string')
  }
  return typeFilterString.split(TYPE_DELIMITER_STR)
}

export function typeIncludesMedia (typeStr) {
  const types = getTypesFromStr(typeStr)
  return types.some(val => ['video', 'audio', 'still'].includes(val))
}

export function typeIncludesTemplate (typeStr) {
  const types = getTypesFromStr(typeStr)
  return types.includes('template')
}

/**
 * Match a type against a type filter
 * @param { TypeFilterSingleType } type
 * @param { string } acceptedTypeFilter
 * @returns { boolean }
 */
export function matchType (type, acceptedTypeFilter) {
  const normalizedType = String(type).toLowerCase()
  const acceptedTypes = getTypesFromStr(acceptedTypeFilter)
  return acceptedTypes.includes(normalizedType)
}

/**
 * Filter an item from the
 * Caspar API using a type filter
 *
 * @param { 'VIDEO' | 'STILL' | 'AUDIO' | 'TEMPLATE' } itemType
 * @param { string } acceptedTypeFilter
 * @returns { boolean }
 */
export function filterByItemType (itemType, acceptedTypeFilter) {
  return matchType(itemType, acceptedTypeFilter)
}
