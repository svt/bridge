// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * Check if the process is running
 * in an environment that is
 * compatible with Electron
 * @returns { Boolean } True if the process is
 *                      compatible with Electron
 */
function isElectron () {
  return process.versions.electron != null
}
exports.isElectron = isElectron

/**
 * Get the identifier for the platform
 * currently running the process
 * @returns { NodeJS.Platform }
 */
function getPlatform () {
  return process.platform
}
exports.getPlatform = getPlatform
