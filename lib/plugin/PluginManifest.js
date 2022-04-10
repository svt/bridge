// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @description A common type definition
 *              for a PluginManifest
 *
 * @typedef {{
 *  id: String
 * }} PluginType
 *
 * @typedef {{
 *  id: String,
 *  description: String,
 *  defaultTrigger: String[],
 *  command: String
 * }} PluginSchortcut
 *
 * @typedef {{
 *  name: String,
 *  version: String,
 *  _path: String,
 *  contributions?: PluginContributions
 * }} PluginManifest
 */

/**
 * @type { PluginManifest }
 */
module.exports = {}
