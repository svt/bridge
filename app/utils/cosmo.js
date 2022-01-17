/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

/**
 * Check if the current
 * environment is Cosmo
 * @returns { Boolean }
 */
export function isCosmoEnv () {
  return window.navigator.userAgent.includes('Cosmo')
}
