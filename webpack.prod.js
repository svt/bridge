const path = require('path')
const crypto = require('crypto')
const common = require('./webpack.common')
const AssetMap = require('webpack-asset-map')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const hash = crypto
  .createHash('md5')
  .update(`${Date.now}${Math.random() * Math.pow(10, 10)}`)
  .digest('hex')

const { merge } = require('webpack-merge')

const prod = {
  mode: 'production',
  plugins: [
    new AssetMap({
      path: './',
      data: {
        /*
        Overwrite the default hash with out own
        as that's what we are using for filenames
        */
        hash,

        /*
        Statically declare which files should be
        included in the application's html

        These are passed through
        the server to /app/template.js
        */
        assets: [
          `${hash}.app.bundle.css`,
          `${hash}.app.bundle.js`,
          `${hash}.api.bundle.js`
        ]
      }
    }),
    new MiniCssExtractPlugin({
      filename: `${hash}.[name].bundle.css`
    })
  ],
  output: {
    path: path.join(__dirname, '/dist'),
    filename: `${hash}.[name].bundle.js`
  }
}

module.exports = common.map(config => {
  return merge(config, { ...prod })
})

/*
Allow all plugins to
be compiled in parallel
as they should not depend
on each other
*/
module.exports.parallelism = module.exports.length
