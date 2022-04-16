# Rundown plugin
Bridge's default rundown plugin

## Description
The plugin supports multiple rundowns per workspace and is one of the standard features of Bridge - allowing for simple organization and playout of items.

## Table of contents
- [Description](#description)
- [API](#api)

## API
This plugin exposes a number of commands that can be invoked using the commands api.

### `rundown.reorderItem(rundownId, itemId, newIndex)`  
Move an item to a new index within a rundown

**Example**
```javascript
/*
Move the item with id 41bc343f-3876-41a7-b142-2f31f768f68b to index 2 in rundown 1
*/
bridge.commands.executeCommand('rundown.reorderItem', 1, '41bc343f-3876-41a7-b142-2f31f768f68b', 2)
```

### `rundown.removeItem(rundownId, itemId)`
Remove an item from a rundown

**Example**
```javascript
/*
Remove the item with id 41bc343f-3876-41a7-b142-2f31f768f68b from rundown 1
*/
bridge.commands.executeCommand('rundown.removeItem', 1, '41bc343f-3876-41a7-b142-2f31f768f68b')
```

### `rundown.appendIten`
Append an item to the end of a rundown
**Example**
```javascript
/*
Append the item with id 41bc343f-3876-41a7-b142-2f31f768f68b to the end of rundown 1
*/
bridge.commands.executeCommand('rundown.appendItem', 1, '41bc343f-3876-41a7-b142-2f31f768f68b')
```