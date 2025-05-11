# Changelog

## 1.0.0-beta.6 - [UNRELEASED]
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