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
        hash
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
