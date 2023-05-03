// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const { merge } = require('webpack-merge')

const plugins = require('./plugins/webpack.config')

const DEFAULT_CONFIG = {
  target: 'web',
  resolve: {
    extensions: ['.jsx', '.js', '.css', '.svg']
  },
  module: {
    rules: [
      {
        test: /\.(svg)$/,
        type: 'asset/source'
      }, {
        test: /\.(gif|png|jp(e*)g|woff|woff2)$/,
        type: 'asset/resource'
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

/*
Create slightly different configs
for the app and api chunks as the
api is using commonjs syntax and
the app es6 syntax
*/
module.exports = [
  merge({ ...DEFAULT_CONFIG }, {
    name: 'app',
    entry: {
      app: './app'
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
                  { regenerator: true }
                ]
              ],
              sourceType: 'module'
            }
          }
        }
      ]
    }
  }),
  merge({ ...DEFAULT_CONFIG }, {
    name: 'api',
    entry: {
      api: './api'
    },
    resolve: {
      alias: {
        worker_threads: false
      }
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
                  { regenerator: true }
                ]
              ],
              sourceType: 'script'
            }
          }
        }
      ]
    }
  }),

  /*
  Bundle the base stylesheet
  for inclusion in widgets
  */
  {
    entry: {
      bridge: './app/bridge.css'
    },
    resolve: {
      extensions: ['.css']
    },
    module: {
      rules: [
        {
          test: /\.(css)$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader'
          ]
        },
        {
          test: /\.(gif|png|jp(e*)g|woff|woff2)$/,
          type: 'asset/resource'
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: '[name].bundle.css'
      })
    ]
  },

  /*
  Include the internal plugins
  to be compiled as well
  */
  ...plugins
]
