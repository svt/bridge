# Build instructions

As Bridge was created with multiple platforms in mind from the start making builds should be a rather painless process and not depend on any specific tooling.

Unless specified the guidelines below apply to all supported platforms.

## Creating an Electron production build

### 1. Make sure a compatible version of Node is installed on your system
Most often the preferred version is the latest LTS release.

### 2. Install dependencies

**Windows build requirements**
- Visual Studio with C++ desktop app build tools
- Python 3

**macOS build requirements**
- Xcode build tools

Run `npm ci` in the project root. This will automatically install dependencies for the core software and any bundled plugins.

### 3. Create a build
Run one of the build commands specified in `package.json`. These differ based on the platform used. A binary will be created in the `bin` directory.   
`npm run electron:build:mac:arm`  
`npm run electron:build:mac:intel`  
`npm run electron:build:win`