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

### `bridge.commands.executeCommand(id[, ...parameters]): Promise`
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

### `bridge.state.apply(set)`
Apply an object to the state using a deep apply algorithm. Listeners for the event `state.change` will be immediately called.

## Server
The server api provides methods for serving files through Bridge's internal web server. This allows the frontend to load static resources even when running as a server deployment. It's often used together with [widgets](#widgets).

### `bridge.server.serveFile(filePath) -> Promise<String>`
Serve a file through the web server. Returns a Promise resolving to the path of the file as it should be requested from the server.

### `bridge.server.serveString(string) -> Promise<String>`
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

### `bridge.settings.registerSetting(groupName, specification) -> Promise<Boolean>`  
Register a new setting definition to a group name, that is the name that will appear in the settings panel's navigation.