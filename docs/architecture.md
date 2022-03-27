# Architecture

As with other Electron apps and classic web apps Bridge is run on two types of processes. Node processes with access to the full node api, such as Electron's main process, and browser processes.

![Processes](/media/docs/architecture/client-server.png)

Rather than loading the views directly from disk however, static files are served using a web server enabling Bridge to be run in a server context as well as in Electron. The only difference being that the electron package is only imported when actually running it as a desktop app.

## Inter process communication (IPC)

As a result of enabling classic server deployments all communication MUST use the standard web protocols, such as HTTP/REST and Websockets - where Websockets are the default and preferred method because of its low overhead and low latency features.

## The shared state

This application relies on a state often referred to as the "shared context" as its main source of truth for project data. The term "context" in this sense is derived from React and its use of the word.

The shared context is simply a react context that's shared between clients. If one client writes data it becomes immediately available to other clients using the context. This enables a natural way to serialize the current application state into a project file that can be imported at a later time, as well as writing "dumb" ui components that include far less internal states.

### How the state is kept in sync

The shared state is synced through a websocket connection between the main process and the renderer processes. Changes to data is sent as a partial update which is merged to the current state in the main process using an [algorithm performing a deep apply](/lib/utils.js) operation. The entire state is then broadcast to other connected clients.

### Context layout

```javascript
{
  /*
  The connections array is populated with
  uuids representing each connected client
  */
  connections: [],

  /*
  Each connected client has its own scope
  on the state that can be populated with
  arbitrary data, indexed by its uuid.
  
  However two properties exist by default.

  path
  Indicates the current path
  the client is visiting

  heartbeat
  Holds the timestamp for the client's
  last heartbeat to the main process,
  in milliseconds since epoch time
  */
  [uuid]: {
    path: '/',
    heartbeat: 0,

    /*
    Indicates whether or not the client
    is currently editing the grid layout
    */
    isEditingLayout: false
  },

  /*
  Settings written to disk between restarts,
  these are specific to the host running 
  the application
  */
  _userDefaults: {
    httpPort: 5544
  }
}
```