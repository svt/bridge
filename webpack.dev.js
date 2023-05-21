// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const prod = require('./webpack.prod')
const { merge } = require('webpack-merge')

const dev = {
  mode: 'development',
  devtool: 'inline-source-map'
}

module.exports = prod.map(config => {
  return merge(config, { ...dev })
})

/*
Allow all plugins to
be compiled in parallel
as they should not depend
on each other
*/
module.exports.parallelism = module.exports.length
