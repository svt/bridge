# Caspar plugin
Bridge's default caspar plugin

## Description
Enables communication with Caspar CG and provides caspar-specific type options to Bridge

## Table of contents
- [Description](#description)
- [API](#api)

## API
This plugin exposes a number of commands that can be invoked using the commands api.

### `caspar.listServers([groups])`
Add a new server to the workspace and returns
its id for further reference

**Example**
```javascript
/*
Variable 'servers' gets defined as
an array of server descriptor objects
*/
const servers = await bridge.commands.executeCommand('caspar.listServers')

/*
Variable 'serversAndGroups' gets defined
as an array of server descriptor objects,
including groups
*/
const serversAndGroups = await bridge.commands.executeCommand('caspar.listServers', true)
```

### `caspar.addServer(serverDescription)`
Add a new server to the workspace and returns
its id for further reference

**Example**
```javascript
const myNewServerId = await bridge.commands.executeCommand('caspar.addServer', { name: 'My server' })
```

### `caspar.removeServer(serverId)`
Remove, and disconnect if connected, a server

**Example**
```javascript
bridge.commands.executeCommand('caspar.removeServer', '41bc343f-3876-41a7-b142-2f31f768f68b')
```

### `caspar.editServer(serverId, serverDescription)`
Edit a server, will replace the old description in the state

**Example**
```javascript
bridge.commands.executeCommand('caspar.editServer', '41bc343f-3876-41a7-b142-2f31f768f68b', { name: 'A new name' })
```

### `caspar.connectServer(serverId, connectionDescription)`
Try to (re)connect a server using a new connection description

**Example**
```javascript
bridge.commands.executeCommand('caspar.connectServer', '41bc343f-3876-41a7-b142-2f31f768f68b', { host: 'localhost', port: 5250 })
```