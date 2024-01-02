const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')

module.exports = {
  plugins: [
    new MonacoWebpackPlugin({
      languages: ['json'],
      features: [
        'comment',
        'colorPicker',
        'smartSelect',
        'multicursor',
        'inlineCompletions',
        'clipboard'
      ]
    })
  ]
}
