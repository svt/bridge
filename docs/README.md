# Full documentation

Welcome to the full documentation for Bridge. Whether you want to build your own extension or are looking for more information about the internals, this is the place to find it.

## Bundled plugins
- [Inspector](/plugins/inspector/README.md)
- [Rundown](/plugins/rundown/README.md)
- [State](/plugins/state/README.md)
- Clock
- [Caspar](/plugins/caspar/README.md)
- [OSC](/plugins/osc/README.md)
- [HTTP](/plugins/http/README.md)

## Developing plugins
- [Guide](/docs/plugins/README.md)
- [Examples](/examples)
- [Styling](/docs/plugins/styling.md)
- [API reference](/docs/api/README.md)
- [Installing plugins](/docs/plugins/installation.md)

## Internals
- [Architecture](/docs/architecture.md)
- [Project structure](/docs/structure.md)
- [Types](/docs/types.md)

## Developing Bridge
- [Build instructions](/docs/build.md)

## Terminology
![Methodology](/media/docs/architecture/methodology.png)

### Workspace
Workspaces are everything you set up for a project. They can be saved and shared as workspace files. A workspace is synced in real time between users connected to the same instance of Bridge.

### Item
Items are the underlying data structure that can be rendered as lists in the rundown or plain buttons. Most items can be played and stopped, doing so will emit an event that can be acted upon by plugins. All items belong to a [type](#type).

### Type
Types are blueprints for items. They define what data an item can contain and in some cases how the UI should be rendered. Types are defined by plugins and can be added and inherited.

[Read more about types](/docs/types.md)

### Tab  
A workspace can have one or many tabs containing widgets. Tabs can be rearranged and different tabs can be opened in different windows.

### Widget  
Widgets are web views hosted by plugins. They provide a user interface that can be used in the workspace and have access to the full Bridge api. Widgets run in the browser process and should contain specialized functionality and be disposable.

### Plugin
Plugins are extensions to Bridge that add specific functionality. They are primarily run in the main process and have access to the full Bridge and Nodejs apis. A plugin can register none, one or multiple widgets that are available in the workspace. They can also react to events and provide their own functionality through commands.
