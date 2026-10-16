// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

/**
 * @description
 * Runs `npm audit` or `npm audit fix`
 * for all bundled plugins in an OS
 * independent manner.
 */

const cp = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const PLUGINS_DIR = path.join(__dirname, '../plugins')

const args = new Set(process.argv.slice(2))
const shouldFix = args.has('--fix')
const isDryRun = args.has('--dry-run')

if (args.has('--help') || args.has('-h')) {
  console.log('Usage: node scripts/audit-plugin-dependencies.js [--fix] [--dry-run]')
  process.exit(0)
}

const command = shouldFix ? 'npm audit fix' : 'npm audit'

function runCommandInPathSync (pluginPath) {
  cp.execSync(command, {
    cwd: pluginPath,
    stdio: 'inherit'
  })
}

const pluginEntries = fs.readdirSync(PLUGINS_DIR)
  .map(pathname => ([path.join(PLUGINS_DIR, pathname), pathname]))
  .filter(([pluginPath]) => fs.statSync(pluginPath).isDirectory())
  .filter(([pluginPath]) => {
    const packagePath = path.join(pluginPath, 'package.json')
    return fs.existsSync(packagePath)
  })

const failedPlugins = []

pluginEntries.forEach(([pluginPath, pluginName]) => {
  console.log('%s\x1b[36m%s\x1b[0m', 'Running command for plugin: ', pluginName)
  console.log('> %s', command)

  if (isDryRun) {
    return
  }

  try {
    runCommandInPathSync(pluginPath)
  } catch (error) {
    failedPlugins.push(pluginName)
  }
})

if (failedPlugins.length > 0) {
  console.error('\nThe command failed for the following plugins:')
  failedPlugins.forEach(pluginName => console.error('- %s', pluginName))
  process.exit(1)
}

console.log('\nCommand completed successfully for all plugins.')
