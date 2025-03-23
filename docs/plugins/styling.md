# Styling plugins
Bridge provides CSS variables and a stylesheet for plugins to use in widgets in order to better fit within the application. Using Bridge's provided values is not mandatory but highly recommended.

## CSS variables
The following CSS variables will be available in all widgets running locally within Bridge. They are updated on load to match the currently selected theme.

```
--base-color
--base-color--accent1
--base-color--accent2
--base-color--accent4
--base-color--accent5
--base-color--grey1
--base-color--grey2
--base-color--grey3
--base-color--shade
--base-color--shade1
--base-color--shade2
--base-color--alert
--base-color--background
--base-fontFamily--primary
--base-color-type--variable
--base-color--notificationColor
--base-color--notificationBackground
```

## Stylesheet
Also provided by Bridge is a bundled stylesheet that can be used to match the application interface. This includes fonts, buttons, inputs, helpers and icons and animations such as the loader.

The stylesheet needs to be included in the widget using the constant exported by the server api `bridge.server.uris.STYLE_RESET`.

[The stylesheet is available here](../../app/bridge.css)

```js
import bridge from 'bridge'

const myWidgetHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <title>Title</title>
      <base href="/" />
      <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}"/>
    </head>
    <body>
    </body>
  </html>
`
```

### Example 1 - Loader
Once the stylesheet is imported a loader can be shown by using the `.Loader` class.

```html
<div class="Loader"></div>
```

Doing this will result in a loader being shown, like below.

![Loader](../../media/docs/plugins/loader.png)