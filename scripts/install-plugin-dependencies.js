// SPDX-FileCopyrightText: 2024 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @description
 * This script installs the NPM
 * dependencies for all bundled plugins
 * in an OS independent manner
 */

const cp = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const PLUGINS_DIR = path.join(__dirname, '../plugins')

/**
 * Synchronously install NPM
 * dependencies for a path
 * @param { String } path
 */
function npmInstallInPathSync (path) {
  cp.execSync('npm install', {
    cwd: path
  })
}

fs.readdirSync(PLUGINS_DIR)
  .map(pathname => ([path.join(PLUGINS_DIR, pathname), pathname]))
  .filter(([pluginPath]) => {
    /*
    Filter out paths that are not directories,
    since we keep a few other files in the plugins
    directory as well
    */
    return fs.statSync(pluginPath).isDirectory()
  })
  .filter(([pluginPath]) => {
    /*
    Filter out paths that don't
    contain a package.json file
    */
    const packagePath = path.join(pluginPath, '/package.json')
    return fs.existsSync(packagePath)
  })
  .forEach(([pluginPath, pluginName]) => {
    console.log('%s\x1b[32m%s\x1b[0m', 'Installing dependencies for plugin: ', pluginName)
    npmInstallInPathSync(pluginPath)
  })
