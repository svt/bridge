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
  .map(plugin => {
    /**
     * Require the plugin's manifest in order to
     * take actions based on its values
     */
    const manifest = require(path.join(__dirname, plugin, '/manifest.json'))

    return {
      name: manifest.bundle,
      entry: {
        [manifest.bundle]: `./plugins/${plugin}/app`
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
            test: /\.(svg|woff2)$/,
            use: {
              loader: 'url-loader'
            }
          }, {
            test: /\.(gif|png|jp(e*)g)$/,
            use: {
              loader: 'url-loader'
            }
          }, {
            test: /\.(css)$/,
            use: [
              MiniCssExtractPlugin.loader,
              'css-loader'
            ]
          }
        ]
      }
    }
  })

module.exports = plugins
