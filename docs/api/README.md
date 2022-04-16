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

Events are useful when listening for global operations such as state updates or play states.

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
`-` | `{key: 'new value'}` | Set a key to a new value. If the key is an array the new value will be appended to the end of the array.
`$delete` | `{key: {$delete: true}}` | Delete a key completely, works for both objects and arrays.
`$replace` | `{myArr: {$replace: ['new', 'values']}}` | Replace a value without trying to merge this key any deeper, this is useful for replacing complete arrays.
`$insert` | `{myArr: {$insert: 'my new value', $index: 2}}` | Insert a value at an index in an array - items will be pushed back and not deleted, this is using a splice operation under the hood.

**Example usage**
```javascript
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

### `bridge.widgets.registerWidget(id, name, uri)`
Register a new widget, it will immediately be made available in the UI

## Settings  
Settings are controls bound to a specific property in the shared state that appear under the plugins section in the settings menu.

There are several types of inputs available for settings; `boolean` and `number`. A setting and its type is declared through the [setting definition](/lib/schemas/setting.schema.json).

### `bridge.settings.registerSetting(groupName, specification): Promise<Boolean>`  
Register a new setting definition to a group name, that is the name that will appear in the settings panel's navigation.

## Types  
Types are blueprints for items, they can be created and extended using the `contributes` property of your plugin manifest.

### `bridge.types.getType(id): Promise<TypeSpec>`
Render a full type specification from its id

## Items
Items are playable objects containing the metadata of a certain type.

### `bridge.items.createItemOfType(typeId): Promise<String>`
Create a new item of a specific type, its id will be returned as a promise.

### `bridge.items.applyItem(id, item)`  
Perform an apply operation to an item by its id - this can be seen as a save, or update, method for an item.

### `bridge.items.getItem(id): Promise<any>`  
Get an item by its id.

### `bridge.items.getLocalItem(id): any`  
Get an item from the local state representation by its id. This is useful when rendering the UI although it is not guaranteed to be up-to-date with the main process.

### `bridge.items.deleteItem(id)`  
Delete an item by its id.