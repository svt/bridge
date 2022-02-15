# Plugin documentation  
Plugins allows Bridge to be extended with functionality, both through the backend main process or by creating UI widgets.

## Table of contents
- [Getting started](#getting-started)
  - [Structure](#structure)
  - [Plugin manifest](#plugin-manifest)
- [API reference](/docs/api/README.md)

## Getting started
Plugins are Javascript packages located in Bridge's plugin directory.

### Structure
```sh
Plugin root
  |- package.json   # The plugin manifest (required)
  |- index.js       # The main entry file (required)
```

### Plugin manifest
Each plugin MUST contain a plugin manifest in the form of `package.json` with a few additional properties. This file is responsible for telling Bridge requirements and contributions made by the plugin in order to run it correctly and efficiently. 