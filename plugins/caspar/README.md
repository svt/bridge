# Caspar plugin
Bridge's default caspar plugin

## Description
Enables communication with Caspar CG and provides caspar-specific type options to Bridge

## Table of contents
- [Description](#description)
- [API](#api)

## API
This plugin exposes a number of commands that can be invoked using the commands api.

### `caspar.server.add(serverDescription)`
Add a new server to the workspace and returns
its id for further reference

**Example**
```javascript
const myNewServerId = await bridge.commands.executeCommand('caspar.server.add', { name: 'My server' })
```

### `caspar.server.remove(serverId)`
Remove, and disconnect if connected, a server

**Example**
```javascript
bridge.commands.executeCommand('caspar.server.remove', '41bc343f-3876-41a7-b142-2f31f768f68b')
```

### `caspar.server.edit(serverId, serverDescription)`
Edit a server, will replace the old description in the state

**Example**
```javascript
bridge.commands.executeCommand('caspar.server.edit', '41bc343f-3876-41a7-b142-2f31f768f68b', { name: 'A new name' })
```

### `caspar.server.connect(serverId, connectionDescription)`
Try to (re)connect a server using a new connection description

**Example**
```javascript
bridge.commands.executeCommand('caspar.server.connect', '41bc343f-3876-41a7-b142-2f31f768f68b', { host: 'localhost', port: 5250 })
```