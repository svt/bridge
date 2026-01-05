# Changelog

## 1.0.0-beta.9 - [UNRELEASED]
### Added
- Support for named urls when sharing links to workspaces
### Fixed
- An issue where the inspector started to scroll horisontally on overflow
- Closing electron windows may cause a loop preventing user defaults from being saved

## 1.0.0-beta.8
### Fixed
- The space key can now be used for keyboard shortcuts
- An issue where items in the rundown couldn't rapidly be selected and de-selected
- An issue where context menus were cut off in the rundown
- An issue with the palette not setting proper keys
- An issue with the palette not removing event listeners
- The escape key causes weird behaviour when editing a shortcut
- Closing shortcuts with the escape key prevents context menus in the edit mode
- An issue that crashed the app in windows when opened with an invalid file path as runtime argument
### Added
- Support for selecting multiple items at once with the shift key
- An API for managing context menus
- An API for managing the clipboard
- Search in context menus
- Keyboard control in context menus
- Allow for setting default on play and on end actions
- A modal stack for controlling the order in which modals are closed
- A prompt to save if unsaved changes are detected

## 1.0.0-beta.7
### Changed
- Worker errors now show as messages in the UI
- Refactored websocket logic
### Added
- Buttons for reload and the palette to the header
- Floating widgets
- A compact option for rundown items
- Authorization for commands

## 1.0.0-beta.6
### Changed
- item.data.caspar.data replaces item.data.templateData for structured template data
- Update dependencies
- react-router has been removed in favor of a custom component
### Fixed
- Security patches
### Added
- The `item.apply` event
- A volume item type for the Caspar plugin
- Support for additional frame rates when calculating durations of items in the Caspar plugin
- Status messages that indicate background activity to the user
- A compatibility mode for servers running versions of CasparCG prior to 2.1.0

## 1.0.0-beta.5
### Changed
- Updated caniuse db
- Updated Babel dependencies
- UX improvements
- Stability improvements
### Fixed
- An issue resulting in event handlers not being properly dropped by owner
- An issue where large responses from Caspar were cut off
### Added
- Listing of templates in the Caspar library widget

## 1.0.0-beta.4
### Added
- HTTP plugin with support for GET requests
- A system api for getting the current release version
### Changed
- The server API is now using dependency injection
- The default font is now Inter

## 1.0.0-beta.3
### Fixed
- An issue where context menus would get stuck when triggered by rundown items
### Added
- Time indicators in the rundown when items are scheduled or triggered
- On end actions for playable items
- An onEnd event
- A note regarding supported Caspar server versions in settings

## 1.0.0-beta.2
### Changed
- Updated UI
### Fixed
- General bug fixes

## 1.0.0-beta.1
### Changed
- Initial development version