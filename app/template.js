/**
 * @copyright Copyright © 2021 SVT Design
 * @author Axel Boberg <axel.boberg@svt.se>
 */

const path = require('path')

/**
 * Map filetypes to html-strings for
 * rendering assets in the header
 */
const ASSET_HTML = {
  '.js': asset => `<script src="${asset}" defer></script>`,
  '.css': asset => `<link rel="stylesheet" href="${asset}"/>`
}

function render (state, assets) {
  /**
   * Render assets as HTML
   * based on their extensions
   * @type { string }
   */
  const renderedAssets = (assets || [])
    .map(asset => {
      const ext = path.extname(asset)

      if (!ASSET_HTML[ext]) return ''
      return ASSET_HTML[ext](asset)
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html lang="sv-SE">
      <head>
        ${
          state.base
          ? `<base href="${state.base}" />`
          : ''
        }
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=0">
        ${renderedAssets}
        <script>
          window.initialState = ${JSON.stringify(state)}
        </script>
        <title>Bridge</title>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `
}

module.exports = render
