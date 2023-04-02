// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Recursively deep merge two objects,
 * the source object will be applied
 * in place to the target object
 *
 * @param { any } targetObj
 * @param { any } sourceObj
 * @returns { any } The target object
 */
function mergeDeep (targetObj, sourceObj) {
  for (const key of Object.keys(sourceObj)) {
    /*
    If the $replace keyword is used,
    replace the value directly

    { $replace: value }
    */
    if (sourceObj[key]?.$replace) {
      targetObj[key] = sourceObj[key].$replace
      continue
    }

    /*
    Delete the key if the
    $delete keyword is present

    { $delete: true }
    */
    if (sourceObj[key]?.$delete) {
      if (Array.isArray(targetObj)) {
        targetObj.splice(key, 1)
      } else {
        delete targetObj[key]
      }
      continue
    }

    /*
    Insert a value at an index in an array
    using a splice operation

    {
      $insert: value,
      $index: 2,
      $delete
    }
    */
    if (
      Object.prototype.hasOwnProperty.call((sourceObj[key] || {}), '$insert') &&
      Array.isArray(targetObj[key])
    ) {
      targetObj[key].splice(sourceObj[key].$index, 0, sourceObj[key]?.$insert)
      continue
    }

    /*
    If the target object doesn't have
    the property, assign it directly
    */
    if (!Object.prototype.hasOwnProperty.call(targetObj, key)) {
      targetObj[key] = sourceObj[key]
      continue
    }

    /*
    If the current value is primitive,
    replace it
    */
    if (typeof targetObj[key] !== 'object' && !Array.isArray(targetObj[key])) {
      targetObj[key] = sourceObj[key]
      continue
    }

    /*
    Merge arrays by appending the
    source array to the target array if the
    $push operation is specified
    */
    if (Array.isArray(targetObj[key]) && Array.isArray(sourceObj[key].$push)) {
      targetObj[key].push(...sourceObj[key].$push)
      continue
    }

    /*
    Merge arrays by using indexes (source[2] will replace target[2] e.t.c.),
    this makes arrays behave much like dictionaries
    */
    if (Array.isArray(targetObj[key]) && Array.isArray(sourceObj[key])) {
      for (let i = 0; i < sourceObj[key].length; i++) {
        if (
          targetObj[key][i] &&
          typeof targetObj[key][i] === 'object' &&

          sourceObj[key][i] &&
          typeof sourceObj[key][i] === 'object'
        ) {
          mergeDeep(targetObj[key][i], sourceObj[key][i])
          continue
        }
        targetObj[key][i] = sourceObj[key][i]
      }
      continue
    }

    /*
    Assign primitive
    values directly
    */
    if (typeof sourceObj[key] !== 'object') {
      targetObj[key] = sourceObj[key]
      continue
    }

    mergeDeep(targetObj[key], sourceObj[key])
  }
  return targetObj
}
exports.deep = mergeDeep
