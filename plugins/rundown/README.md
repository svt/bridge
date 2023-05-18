# Rundown plugin
Bridge's default rundown plugin

## Description
The plugin supports multiple rundowns per workspace and is one of the standard features of Bridge - allowing for simple organization and playout of items.

## Table of contents
- [Description](#description)
- [API](#api)

## API
This plugin exposes a number of commands that can be invoked using the commands api.

### `rundown.moveItem(newRundownId, newIndex, itemId)`
Move an item to a new index within a rundown

**Example**
```javascript
/*
Move the item with id h7ft to index 2 in rundown g4sd
*/
bridge.commands.executeCommand('rundown.moveItem', 'g4sd', 2, 'h7ft')
```

### `rundown.removeItem(rundownId, itemId)`
Remove an item from a rundown

**Example**
```javascript
/*
Remove the item with id h7ft from rundown 1
*/
bridge.commands.executeCommand('rundown.removeItem', 1, 'h7ft')
```

### `rundown.appendItem(rundownId, itemId)`
Append an item to the end of a rundown

**Example**
```javascript
/*
Append the item with id h7ft to the end of rundown fds4
*/
bridge.commands.executeCommand('rundown.appendItem', 'fds4', 'h7ft')
```

### `rundown.copyItem`
Create a copyable string an item's representation

**Example**
```javascript
/*
Create a string representation of the item with id h7ft
*/
bridge.commands.executeCommand('rundown.copyItem', 'h7ft')
```