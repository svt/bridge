<img src="media/appicon.png" alt="drawing" width="80" style="margin-left:-10px;" />

# Bridge  
![Test](https://github.com/svt/bridge/actions/workflows/.github/workflows/test.yml/badge.svg?branch=main)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![REUSE status](https://api.reuse.software/badge/github.com/svt/bridge)](https://api.reuse.software/info/github.com/svt/bridge)  

An extendable graphics playout client that's both a desktop app and a cloud service

**This project is still in very early development**

![Screenshot](/media/screenshot.png)

## Goals

- [ ] ⚡️ To be a server agnostic, lightweight and quick playout client
- [ ] 🧑‍💻 To be easily extendable with plugins and encourage contribution 
- [ ] 💪 To provide a reliable backbone for productions

## Table of contents
- [Goals](#goals)
- [Motivation](#motivation)
- [Features](#features)
- [Documentation and API](#full-documentation-and-api)
- [Security](#security)
- [License](#license)
- [Maintainers](#primary-maintainer)

## Motivation  

As developers of production software we found ourselves in a position of rebuilding tools with similar functionality and core features time and time again. Bridge is an experiment for a collection of core tools and a platform for plugins that enables reuse of the tools we build. Not only does it encourage a mix-and-match mindset where operators can choose from a selection of already built components, it cuts down on development time and enforces stability.

## Features

- [ ] Core features are bundled (rundown, default types, timeline e.t.c.)
- [ ] Can be run both as a desktop app and a cloud deployment
- [ ] Can be used by many operators simultaneously with real time sync
- [ ] A fully customizable grid layout

## Full documentation and API

The full documentation is hosted in this repository under the [`docs`](/docs/README.md) directory. Whether you want to build your own extension or learn more about the internal structure of Bridge - that's probably where you should head to start your journey.

[Full documentation](/docs/README.md)

## Security  
Always keep an eye open when interacting with third party code. As a general rule, **never run code you don't trust.** This includes third party plugins as they have a great amount of access when running on your computer or server.

## License

Bridge source code is released under the:

[MIT License](LICENSE.md)

Most of the other material as icons are relased under a Creative Commons License, see .reuse/dep5 for further information about them.


----

## Primary Maintainer

[Axel Boberg](https://github.com/axelboberg)