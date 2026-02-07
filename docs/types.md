# Types
All items have a type. It's a blueprint for the data it contains and in some cases how it should be rendered in the UI. Bridge comes with a set of server agnostic bundled types.

## Bundled types

### Groups
The group type is a container for multiple items that belong together. Groups can be nested and provides alternatives for playing their children.

### Divider
Items of this type cannot be played. They are simply dividers with a name, color and note.

### Variable
Variables set a value to the state when played. Their values can be used throughout the application.

### Reference
A reference is a pointer to another item. It's useful when an item needs to be present as more than one instance but without duplicating its data.

### Trigger  
Inherits all functionality from references but are played by an outside event. Such as timecode or keyboard shortcuts.