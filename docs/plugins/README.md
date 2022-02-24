<!--
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
-->

# Plugin documentation  
Plugins allows Bridge to be extended with functionality, both through the backend main process or by creating UI widgets.

## Table of contents
- [Getting started](#getting-started)
  - [Structure](#structure)
  - [Plugin manifest](#plugin-manifest)
    - [version](#version)
    - [name](#name)
    - [main](#main)
    - [engines](#engines)
- [API reference](/docs/api/README.md)

## Getting started
Plugins are Javascript packages located in Bridge's plugin directory.

### Structure
```sh
Plugin root
  |- package.json   # The plugin manifest (required)
  |- index.js       # The main entry file
```

### Plugin manifest
Each plugin MUST contain a plugin manifest in the form of `package.json` with a few additional properties. This file is responsible for telling Bridge requirements and contributions made by the plugin in order to run it correctly and efficiently. 

```js
{
  "version": "1.0.0",
  "name": "my-plugin",
  "main": "index.js",
  "engines": {
    "bridge": "^1.0.0"
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
**Required**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#main](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#main)*  
The package's main file which will be run in the main process. If not specified Bridge will default to `index.js` in the plugin root.

#### engines
**Required**  
*See [https://docs.npmjs.com/cli/v8/configuring-npm/package-json#engines](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#engines)*  
Declare what version of Bridge is required to run the plugin. This property is required and must contain the `bridge` key and a valid semver tag.