# Architecture

As with other Electron apps and classic web apps Bridge is run on two types of processes. Node processes with access to the full node api, such as Electron's main process, and browser processes.

![Processes](/media/docs/architecture/client-server.png)

Rather than loading the views directly from disk however, static files are served using a web server enabling Bridge to be run in a server context as well as in Electron. The only difference being that the electron package is only imported when actually running it as a desktop app.

## Inter process communication (IPC)

As a result of enabling classic server deployments all communication MUST use the standard web protocols, such as HTTP/REST and Websockets - where Websockets are the default and preferred method because of its low overhead and low latency features.