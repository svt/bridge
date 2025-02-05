# Plugin documentation  
Plugins allows Bridge to be extended with functionality, both through the backend main process or by creating UI widgets.

## Table of contents
- [Examples](#examples)
- [Getting started](#getting-started)
  - [Structure](#structure)
  - [Plugin manifest](#plugin-manifest)
    - [version](#version)
    - [name](#name)
    - [main](#main)
    - [engines](#engines)
    - [contributes](#contributes)
  - [Building plugins](#building-plugins)
  - [Installing plugins](./installation.md)
- [API reference](/docs/api/README.md)

## Examples
Example plugins can be found in the [examples directory](../../examples)

## Getting started
Plugins are Javascript packages located in Bridge's plugin directory.

### Structure
```sh
Bridge plugin directory
  |- my-plugin
    |- package.json   # The plugin manifest (required)
    |- index.js       # The main entry file (optional - only required if the plugin has a script to execute)
```

### Plugin manifest
Each plugin MUST contain a plugin manifest in the form of `package.json` with a few additional properties.
This file is responsible for telling Bridge requirements and contributions made by the plugin in order to run it correctly and efficiently.

Contributions can be added either through `package.json` or using the matching api method, such as `bridge.types.registerType(typeObject)`.

**Example manifest**
```json
{
  "version": "1.0.0",
  "name": "my-plugin",
  "main": "index.js",
  "engines": {
    "bridge": "^1.0.0"
  },
  "contributes": {
    "shortcuts": [
      {
        "id": "my-plugin.shortcuts.my-shortcut",
        "action": "my-plugin.my-action",
        "description": "Executes my cool action",
        "trigger": ["Shift", "A"]
      }
    ],
    "settings": [
      {
        "title": "My boolean setting",
        "description": "Manage my boolean value",
        "bind": "shared.plugins.my-plugin.settings.boolean-setting",
        "inputs": [
          { "type": "boolean", "bind": "value", "label": "My setting's value" }
        ]
      }
    ],
    "types": [
      {
        "id": "my-plugin.types.my-image-type",
        "inherits": "bridge.types.image",
        "properties": {
          "my-plugin.my-property": {
            "name": "My property",
            "type": "string",
            "group": "Cool settings"
          }
        }
      }
    ]
  }
}
```

#### version
**Required**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#version](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#version)*  
The plugin's current version as a semver string.

#### name
**Required**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#name](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#name)*  
The name of the plugin.

#### main
**Optional**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#main](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#main)*  
The package's main file which will be run in the main process. If not specified Bridge won't run any script on plugin initialization.

#### disabled
**Optional**  
A boolean indicating whether this plugin is disabled or not, this is useful for toggling plugins during development

#### engines
**Required**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#engines](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#engines)*  
Declare what version of Bridge is required to run the plugin. This property is required and must contain the `bridge` key and a valid semver tag.

#### contributes
**Optional**  
Optionally declare contributions made by this plugin. See the [API documentation](/docs/api/README.md) for specifics.

### Building plugins
Plugins are agnostic to the choice of build tool as long as the resulting code is commonJS (for backend/worker code) and fully resolved (for frontend/widget code), and packaged as a directory with a `package.json` file.

The only call to require that's allowed in frontend code is `require('bridge')` as that will be resolved during runtime.

Backend code can require external libraries.
