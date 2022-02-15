/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

/**
 * Recursively deep merge two objects,
 * the source object will be applied
 * in place to the target object
 *
 * @param { any } targetObj
 * @param { any } sourceObj
 * @returns { any } The target object
 */
export function deepApply (targetObj, sourceObj) {
  for (const key of Object.keys(sourceObj)) {
    /*
    If the $replace keyword is used,
    replace the value directly
    */
    if (sourceObj[key]?.$replace) {
      targetObj[key] = sourceObj[key].$replace
      continue
    }

    /*
    Delete the key if the
    $delete keyword is present
    */
    if (sourceObj[key]?.$delete) {
      delete targetObj[key]
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
    source array to the target array
    */
    if (Array.isArray(targetObj[key]) && Array.isArray(sourceObj[key])) {
      targetObj[key].push(...sourceObj[key])
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

    deepApply(targetObj[key], sourceObj[key])
  }
  return targetObj
}
