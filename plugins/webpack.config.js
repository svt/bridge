// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const fs = require('fs')
const path = require('path')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const PLUGINS_DIR = './plugins'

/**
 * Webpack configurations
 * for each of the plugins
 */
const plugins = fs.readdirSync(PLUGINS_DIR)
  .filter(pathname => {
    /*
    Filter out paths that are not directories,
    since we keep a few other files in the plugins
    directory as well
    */
    const pluginPath = path.join(PLUGINS_DIR, pathname)
    return fs.statSync(pluginPath).isDirectory()
  })
  .filter(pathname => {
    /*
    Filter out paths that don't
    contain widgets
    */
    const widgetPath = path.join(PLUGINS_DIR, pathname, '/app')
    return fs.existsSync(widgetPath)
  })
  .map(plugin => {
    /**
     * Require the plugin's manifest in order to
     * take actions based on its values
     */
    const manifest = require(path.join(__dirname, plugin, '/package.json'))

    return {
      name: manifest.name,
      entry: {
        [manifest.name]: `./plugins/${plugin}/app`
      },
      resolve: {
        extensions: ['.jsx', '.js', '.css', '.svg', '.glsl']
      },
      module: {
        rules: [
          {
            test: /\.(js|jsx)$/,
            exclude: /node_modules/,
            use: {
              loader: 'babel-loader',
              options: {
                presets: ['@babel/preset-env', '@babel/preset-react'],
                plugins: [
                  [
                    '@babel/plugin-transform-runtime',
                    {
                      regenerator: true
                    }
                  ]
                ]
              }
            }
          }, {
            test: /\.(svg)$/,
            type: 'asset/source'
          }, {
            test: /\.(gif|png|jp(e*)g|woff2)$/,
            type: 'asset/resource'
          }, {
            test: /\.(css)$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ]
          }
        ]
      },
      externals: {
        bridge: 'commonjs bridge'
      }
    }
  })

module.exports = plugins
