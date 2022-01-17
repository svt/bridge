/**
 * @copyright Copyright © 2022 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

/**
 * Returns whether or not the current
 * window is running as an electron app
 * by checking the user agent
 * @returns { Boolean }
 */
export function isElectron () {
  return window.navigator.userAgent.includes('Bridge')
}
