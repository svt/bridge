# API documentation
Bridge provides a JavaScript api for use in plugins and their widgets. 

## Table of contents  
- [Getting started](#getting-started)
- [Commands](#commands)
- [Events](#events)
- [State](#state)
- [Server](#server)
- [Widgets](#widgets)
- [Settings](#settings)
- [Types](#types)
- [Items](#items)
- [Client](#client)
- [Keyboard shortcuts](#keyboard-shortcuts)

## Getting started  
The api is available for plugins and widgets running in either the main process or browser processes of Bridge and can be included as follows. The module will be provided by Bridge at runtime.

### Using CommonJS
`const bridge = require('bridge')`

### Using ES6 imports
**Note: ES6 modules must be transpiled to CommonJS**  
`import bridge from 'bridge'`

## Commands  
Commands are a way of interacting with Bridge and other plugins. They are a form of RPC. Any data returned from a command handler will be returned as a Promise to `executeCommand`.

### `bridge.commands.registerCommand(id, handler[, returns])`
Register a new command

This is a global operation as commands can only be registered once per workspace. Therefore, prefer registering commands in your plugin's main process.

### `bridge.commands.executeCommand(id[, ...parameters]): Promise<unknown>`
Execute a command

### `bridge.commands.removeCommand(id)`
Unregister a command

## Events
Events are similar to commands however multiple handlers can listen for one event and they cannot return any data to the caller. 

Events are useful when listening for global operations such as state updates or play states. Such as:

```javascript
import bridge from 'bridge'

bridge.events.on('item.play', item => {
  console.log('Item', item, 'is now playing')
  // React to the event
})

bridge.events.on('item.stop', item => {
  console.log('Item', item, 'is now stopped')
  // React to the event
})

bridge.events.on('item.delete', item => {
  console.log('Item', item, 'is now deleted')
  // React to the event
})
```

### `bridge.events.emit(event, ...parameters)`
Emit an event with or without any data

### `bridge.events.on(event, handler)`
Listen for an event

### `bridge.events.once(event, handler)`
Listen for an event but only fire the handler once

### `bridge.events.off(event, handler)`
Remove a listener for an event

## State
The state is a shared object representing the workspace, this is used to render the UI as well as keeping track of settings

### `bridge.state.apply(set|sets)`
Apply an object to the state using a deep apply algorithm. Listeners for the event `state.change` will be immediately called.

**Note**  
Plugins have full access to the state and it's your responsibility as a developer to not overwrite any data needed for Bridge or other plugins. Each plugin have a reserved path (`plugins.plugin-name`) where data can be stored without impacting other plugins. 

It's encouraged to abstract state operations behind custom commands in order to minimize the risk of doing unwanted operations and for better readability.

**Operations**  
Some special operations are available apart from adding data. Most of these can be replicated with logic in your plugin, however, utilizing them usually results in less data being sent between processes and will contribute to a faster end product.

Operation | Example | Description
--- | --- | ---
`-` | `{key: 'new value'}` | Set a key to a new value
`$delete` | `{key: {$delete: true}}` | Delete a key completely, works for both objects and arrays
`$replace` | `{myArr: {$replace: ['new', 'values']}}` | Replace a value without trying to merge this key any deeper, this is useful for replacing complete arrays
`$insert` | `{myArr: {$insert: 'my new value', $index: 2}}` | Insert a value at an index in an array - items will be pushed back and not deleted, this is using a splice operation under the hood
`$push` | `{myArr: {$push: ['foo', 'bar']}}` | Merge an array with an already existing array by pushing all new values to the current array's tail

**Example usage**
```javascript
import bridge from 'bridge'

/*
Apply an object { "foo": "bar" } to
the path of my-plugin
*/
bridge.state.apply({
  plugins: {
    'my-plugin': {
      foo: 'bar'
    }
  }
})

/*
Apply multiple objects in the same call.
Operations are guaranteed to be executed in order.

The following call will add { "baz": "qux" } to the plugin object and immediately remove it before notifying listeners that the state was changed.
*/
bridge.state.apply([
  {
    plugins: {
      'my-plugin': {
        baz: 'qux'
      }
    }
  }, {
    plugins: {
      'my-plugin': {
        baz: { $delete: true }
      }
    }
  }
])
```

### `bridge.state.get([path]): Promise<any>`  
Get the current state directly from the main process. The only argument is an optional dot-notation path specifying the part of the state to be returned. If omitted, the whole state will be returned. Calling this function may also update the local representation of the state.

**Example usage**
```javascript
import bridge from 'bridge'

/*
Getting the full state will also update the local state representation
*/
const fullState = await bridge.state.get()

/*
Partial calls does not update the local state representation
*/
const myPlugin = await bridge.state.get('plugins.my-plugin')
```

### `bridge.state.getLocalState(): any?`  
Get the full local state without going to the main process. This is useful for rendering the UI and for places where async operations aren't possible.

**Example usage**
```javascript
import bridge from 'bridge'

/*
emptyState will be undefined as the state has
not yet been fetched from the main process
*/
const emptyState = bridge.state.getLocalState()

/*
fullState will contain the full and
updated state as it was just fetched
*/
await bridge.state.get()
const fullState = bridge.state.getLocalState()
```

## Server
The server api provides methods for serving files through Bridge's internal web server. This allows the frontend to load static resources even when running as a server deployment. It's often used together with [widgets](#widgets).

### `bridge.server.serveFile(filePath): Promise<String>`
Serve a file through the web server. Returns a Promise resolving to the path of the file as it should be requested from the server.

### `bridge.server.serveString(string): Promise<String>`
Serve a string as a file throught the web server. Returns a Promise resolving to the path of the file as it should be requested from the server.

### `bridge.server.unserve(id)`
Stop serving a file by its id

## Widgets
Widgets are web views controlled by plugins. They can provide additional functionality to the UI.

### `bridge.widgets.registerWidget(spec)`
Register a new widget, it will immediately be made available in the UI

```javascript
import bridge from 'bridge'

bridge.widgets.registerWidget({
  id: 'myplugin.widget',
  name: 'My widget',
  uri: '/server/id-of-widget-entry',
  description: 'A widget meant for demo purposes'
})
```

## Settings  
Settings are controls bound to a specific property in the shared state that appear under the plugins section in the settings menu.

There are several types of inputs available for settings. A setting and its type is declared through the [setting definition](/lib/schemas/setting.schema.json).

### `bridge.settings.registerSetting(specification): Promise<Boolean>`
Register a new setting definition to a group name, that is the name that will appear in the settings panel's navigation.

## Types  
Types are blueprints for items, they can be created and extended using the `contributes` property of your plugin manifest.

```js
...in package.json

"contributes": {
  "types": [
    {
      /*
      The type id must be globally unique
      */
      "id": "my-plugin.types.my-type",
      "name": "My type",
      "category": "My plugin",

      /*
      Inherit properties from
      another type
      */
      "inherits": "bridge.types.media",
      "properties": {

        /*
        The property key must be globally unique and will
        be used as the binding point for the value

        It can, but is not required to be,
        a dot-notation path

        The key my-plugin.my-property will result
        in the value being bound to item.data.my-plugin.my-property
        */
        "my-plugin.my-property": {
          "name": "My property",
          "type": "string",
          "default": "A default value",

          /*
          Whether or not to allow variables,
          setting this to true will replace
          any variable string in the property's
          value with the variable value on play

          Defaults to false
          */
          "allowsVariables": true,

          /*
          All properties with the same group
          will be shown together in the
          inspector
          */
          "ui.group": "My plugin"
        },

        /*
        Plugins can can provide their own
        inputs in the form of an inspector
        widget using 'ui.uri'.

        Note that using a custom inspector widget makes you
        responsible for rendering both the UI as well as
        binding the input to the state.

        It's most often preferred to use
        the functional api when registering
        a type with 'ui.uri' as you can then
        calculate the path.
        */
        "my-plugin.my-second-property": {
          "name": "My second property",
          "type": "string",
          "ui.uri": "/path/to/custom/input"
        },
      }
    }
  ]
}
``

### `bridge.types.getType(id): Promise<TypeSpec>`
Render a full type specification from its id

### `bridge.types.registerType(spec): Promise<Boolean>`
Register a type

## Items
Items are playable objects containing the metadata of a certain type.

### `bridge.items.createItem(typeId): Promise<String>`
Create a new item of a specific type, its id will be returned as a promise.

### `bridge.items.applyItem(id, item)`  
Perform an apply operation to an item by its id - this can be seen as a save, or update, method for an item.

### `bridge.items.getItem(id): Promise<any>`  
Get an item by its id.

### `bridge.items.getLocalItem(id): any`  
Get an item from the local state representation by its id. This is useful when rendering the UI although it is not guaranteed to be up-to-date with the main process.

### `bridge.items.deleteItem(id)`  
Delete an item by its id.

### `bridge.items.playItem(id): Promise<Void>`
Play an item and set its state to 'playing'.

### `bridge.items.stopItem(id): Promise<Void>`
Stop an item and set its state to 'stopped'.

## Client  
**The client api is only available within renderer processes**  
Control aspects of the current client

### `bridge.client.getIdentity(): String?`  
Get the client's identity as set by the host app. This may be undefined if it has not yet been set. It's useful for manually getting client parameters if optimizing queries to the state.

### `bridge.client.setSelection(items)`
Select one or multiple items, will clear the current selection

### `bridge.client.clearSelection()`  
Clear the current selection

### `bridge.client.getSelection(): Promise<String[]>`  
Get the current selection

## Keyboard shortcuts  
Keyboard shortcuts SHOULD be registered with the API to give the user an index of which commands are available.
Shortcut triggers can be overridden by the user in the settings panel.

### Listening to keyboard shortcuts
Keyboard shortcuts are emitted using **DOM events** and **not `bridge.events`**.
This is because keyboard shortcuts are only an alias for keyboard events and should be handled locally.

Listen to a registered shortcut by subscribing to the `shortcut` DOM event, such as:

```javascript
import bridge from 'bridge'

const el = document.createElement('div')

el.addEventListener('shortcut', e => {
  console.log('Shortcut was triggered with id:', e.detail.id)

  // React to action
})
```

### Registering a shortcut using `contributes`
A shortcut can be registered using `contributes.shortcuts` in a plugin's `package.json`.
The field should be set to an array of shortcut-specification objects. Such as:

```json
{
  "name": "my-plugin",
  "version": "1.0.0",
  "description": "",
  "engines": {
    "bridge": "^0.0.1"
  },
  "contributes": {
    "shortcuts": [
      {
        "id": "bridge.shortcuts.play",
        "description": "My custom shortcut",
        "trigger": ["Shift", "A"]
      },
      {
        "id": "bridge.shortcuts.stop",
        "description": "My second custom shortcut",
        "trigger": ["Shift", "B"]
      }
    ]
  }
}
```

### `bridge.shortcuts.registerShortcut(spec)`
Register a new keyboard shortcut using a shortcut specification.  
See the [shortcut schema](/lib/schemas/shortcuts.schema.json) for available keys to use as triggers.

```javascript
import bridge from 'bridge'

bridge.shortcuts.registerShortcut({
  id: 'myPlugin.shortcuts.myShortcut',
  description: 'Trigger my command',
  trigger: ['Shift', 'Meta', 'A']
})
```
