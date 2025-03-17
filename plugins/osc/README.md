# OSC plugin
Bridge's default OSC plugin

## Description
This plugin allows external services to communicate to Bridge using the Open Sound Control protocol (OSC).

## Table of contents
- [Description](#description)
- [Reference](#reference)

## Reference  
The following list is a reference of the OSC paths that are available within this plugin.

### `/api/commands/executeCommand`  
Execute a command  

#### Arguments  
| Index | Type | Description |
| --- | --- | --- |
| 0 | String | The id of the command to execute |
| 1...n | any | Arguments that will be passed to the command |

### `/api/items/playItem`  
Play an item

#### Arguments  
| Index | Type | Description |
| --- | --- | --- |
| 0 | String | The id of the item to play |

### `/api/items/stopItem`  
Stop an item

#### Arguments  
| Index | Type | Description |
| --- | --- | --- |
| 0 | String | The id of the item to stop |

### `/api/client/selection/play`  
Play the main client's current selection

### `/api/client/selection/stop`  
Stop the main client's current selection

### `/api/items/tags/:tag/play`  
Play all items with the specified tag

### `/api/items/tags/:tag/stop` 
Stop all items with the specified tag