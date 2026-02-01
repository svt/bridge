/**
 * @description
 * Pre build actions for macOS-builds
 * Run as `node electron-prebuild-macos.js <arm64|x64>`
 *
 * Actions:
 * - Rebuild native addons for all plugins
 */

const cp = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')
const assert = require('node:assert')

const [,, ARCH] = process.argv
assert(ARCH, 'Missing required argument \'arch\'')

const PLUGINS_DIR = path.join(__dirname, '../plugins')
const MAIN_DIR = path.join(__dirname, '../')

function forcePackageRebuild (path, arch) {
  cp.execSync(`npm run env -- electron-rebuild -f -a ${arch}`, {
    cwd: path
  })
}

console.log('Performing pre build tasks')
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
    console.log('%s\x1b[32m%s\x1b[0m', 'Rebuilding addons for plugin: ', pluginName)
    forcePackageRebuild(pluginPath, ARCH)
  })

console.log('%s\x1b[32m%s\x1b[0m', 'Rebuilding addons for main codebase')
forcePackageRebuild(MAIN_DIR, ARCH)
