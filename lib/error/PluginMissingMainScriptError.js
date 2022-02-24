// Copyright © 2022 SVT Design
// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

class PluginMissingMainScriptError extends Error {
  constructor () {
    super('Plugin has no main script')
    this.name = 'PluginMissingMainScriptError'
    this.code = 'ERR_PLUGIN_MISSING_MAIN_SCRIPT'
  }
}

module.exports = PluginMissingMainScriptError
