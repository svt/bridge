const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const plugins = require('./plugins/webpack.config')

module.exports = [
  {
    name: 'main',
    entry: './app',
    node: { global: true },
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
  },

  /*
  Include the internal plugins
  to be compiled as well
  */
  ...plugins
]
