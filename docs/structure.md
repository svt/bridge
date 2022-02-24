<!--
SPDX-FileCopyrightText: 2022 Sveriges Television AB

SPDX-License-Identifier: MIT
-->

# Project structure

This repository contains the code needed for the node process (Electron main), the frontend (Electron renderer), the extension api and documentation.

The file tree looks like the following:
```sh
bridge
  |- api      # The plugin api, shared between processes
      |- browser    # Browser specific code
      |- node       # Node specific code
  |- app      # Frontend code
      |- assets     # Bundled assets
      |- components # React components
      |- hooks      # React hooks
      |- utils      # Utility files
      |- views      # Views
  |- docs     # Documentation
  |- lib      # Node/backend
  |- media    # Static media for the documentation
  |- plugins  # Bundled plugins (not external ones)
  |- public   # Static files served by the web server

  These are created during the build process:
  
  |- dist     # Bundled js and css files, webpack output
  |- bin      # The built electron app
```