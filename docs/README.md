

# Full documentation

Welcome to the full documentation for Bridge. Whether you're want to build your own extension or are looking for more information about the internals, this is the place to find it.

**This project is still in early development and more content will be added periodically**

## Terminology
![Methodology](/media/docs/architecture/methodology.png)

### Workspace
Workspaces are everything you set up for a project. They can be saved and shared as workspace files. A workspace is synced in real time between users connected to the same instance of Bridge.

### Tab  
A workspace can have one or many tabs containing widgets. Tabs can be rearranged and different tabs can be opened in different windows.

### Widget  
Widgets are web views hosted by plugins. They provide a user interface that can be used in the workspace and have access to the full Bridge api. Widgets run in the browser process and should contain specialized functionality and be disposable.

### Plugin
Plugins are extensions to Bridge that add specific functionality. They are primarily run in the main process and have access to the full Bridge and Nodejs apis. A plugin can register none, one or multiple widgets that are available in the workspace. They can also react to events and provide their own functionality through commands.

## Plugins
- [Guide](/docs/plugins/README.md)
- [API reference](/docs/api/README.md)

## Internals
- [Architecture](/docs/architecture.md)
- [Project structure](/docs/structure.md)