// SPDX-FileCopyrightText: 2026 Axel Boberg
//
// SPDX-License-Identifier: MIT

const bridge = require('bridge')

const Server = require('./lib/Server')
const Session = require('./lib/Session')
const registerTools = require('./lib/tools')

const OpenAIModel = require('./lib/models/OpenAIModel')
const AnthropicModel = require('./lib/models/AnthropicModel')
const CustomModel = require('./lib/models/CustomModel')

const { InMemoryTransport } = require('@modelcontextprotocol/sdk/inMemory.js')

const manifest = require('./package.json')
const assets = require('../../assets.json')

/**
 * @typedef {{
 *  text: string
 * }} UserQuery
 */

const MODELS = {
  openai: OpenAIModel,
  anthropic: AnthropicModel,
  custom: CustomModel
}

const SETTINGS_STATE_PATH = '_userDefaults.bridge-plugin-agent.settings'

const LEGAL_TOAST = 'Enabling AI models or third-party MCP services allows them to access the content of the workspaces you use with the agent. Read more below.'

const CHAT_HISTORY_MAX_LENGTH = 100

const session = new Session()
const server = new Server()
const chatHistory = []

/**
 * Generate a short random ID
 * @returns { string }
 */
function generateId () {
  return Math.random().toString(36).slice(2)
}

/**
 * Append a message to chatHistory,
 * keeping the list within CHAT_HISTORY_MAX_LENGTH
 * @param { object } msg
 */
function appendToHistory (msg) {
  chatHistory.push(msg)
  if (chatHistory.length > CHAT_HISTORY_MAX_LENGTH) {
    chatHistory.splice(0, chatHistory.length - CHAT_HISTORY_MAX_LENGTH)
  }
}

let model
const settings = {
  provider: 'openai',
  model: undefined,
  apiKey: undefined,
  baseUrl: undefined
}

registerTools(server, session)

async function serveHtml ({ js, css }) {
  return bridge.server.serveString(`
    <html>
      <head>
        <title>Agent</title>
        <base href="/"></base>
        <link rel="stylesheet" href="${bridge.server.uris.STYLE_RESET}" />
        <link rel="stylesheet" href="${css}" />
        <script src="${js}" defer></script>
      </head>
      <body>
        <div id="root"></div>
      </body>
    </html>
  `)
}

exports.activate = async () => {
  const cssPath = `${assets.hash}.${manifest.name}.bundle.css`
  const jsPath = `${assets.hash}.${manifest.name}.bundle.js`
  const htmlPath = await serveHtml({ js: jsPath, css: cssPath })

  bridge.widgets.registerWidget({
    id: 'bridge.plugins.agent',
    name: 'Agent',
    uri: `${htmlPath}?path=chat`,
    description: 'A chat agent',
    supportsFloat: true
  })

  bridge.settings.registerSetting({
    title: '',
    group: 'Agent',
    inputs: [
      {
        type: 'warning',
        description: LEGAL_TOAST
      },
      { type: 'frame', uri: `${htmlPath}?path=settings` }
    ]
  })

  /*
  Register a command for the settings
  UI to retrieve the current state
  */
  bridge.commands.registerCommand('agent.getSettings', () => {
    return {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey || '',
      baseUrl: settings.baseUrl || '',
      hasKey: !!settings.apiKey
    }
  })

  /**
   * Initialize the model from the
   * current settings if a key and
   * provider are available
   *
   * @returns { Promise<void> }
   */
  async function initializeModel () {
    model = undefined
    session.setModel(undefined)

    const ModelClass = MODELS[settings.provider]
    if (!ModelClass) {
      return
    }

    /*
    Custom provider needs a base URL,
    others need an API key
    */
    if (settings.provider === 'custom') {
      if (!settings.baseUrl) {
        return
      }
    } else if (!settings.apiKey) {
      return
    }

    model = new ModelClass()
    await model.initialize({
      model: settings.model,
      [settings.provider]: {
        apiKey: settings.apiKey,
        baseUrl: settings.baseUrl
      }
    })
    session.setModel(model)
  }

  /*
  Register a command for the settings
  UI to update settings and
  re-initialize the model
  */
  bridge.commands.registerCommand('agent.setSettings', async (payload) => {
    if (payload.provider) {
      settings.provider = payload.provider
    }
    if (payload.model) {
      settings.model = payload.model
    }
    if (payload.apiKey !== undefined) {
      settings.apiKey = payload.apiKey
    }
    if (payload.baseUrl !== undefined) {
      settings.baseUrl = payload.baseUrl
    }

    await bridge.state.apply(SETTINGS_STATE_PATH, {
      provider: settings.provider,
      model: settings.model,
      apiKey: settings.apiKey,
      baseUrl: settings.baseUrl
    })

    await initializeModel()
  })

  /*
  Register a command to retrieve the
  current conversation history
  */
  bridge.commands.registerCommand('agent.getHistory', () => {
    return { messages: [...chatHistory] }
  })

  /*
  Register a command to list available
  models from the current provider,
  requires a valid API key to be set
  */
  bridge.commands.registerCommand('agent.listModels', async () => {
    if (!model) {
      return { models: [] }
    }
    const models = await model.listModels()
    return { models }
  })

  /*
  Load persisted settings from
  state, falling back to config.json
  */
  const defaults = await bridge.state.get('_userDefaults')
  const persisted = defaults?.['bridge-plugin-agent']?.settings

  if (persisted?.provider) {
    settings.provider = persisted.provider
  }

  if (persisted?.model) {
    settings.model = persisted.model
  }

  if (persisted?.apiKey) {
    settings.apiKey = persisted.apiKey
  }

  if (persisted?.baseUrl !== undefined) {
    settings.baseUrl = persisted.baseUrl
  }

  await initializeModel()

  /*
  Setup server
  */
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
  server.connect(serverTransport)

  /*
  Setup session
  */
  session.addClient('bridge', clientTransport)

  bridge.commands.registerCommand('agent.query', async msg => {
    if (!msg?.text) {
      return
    }

    const userMsg = {
      ...msg,
      id: generateId(),
      type: 'user'
    }

    appendToHistory(userMsg)
    bridge.events.emit('agent.message', userMsg)

    function callback (err, props) {
      if (err) {
        bridge.events.emit('agent.message', {
          text: err?.message,
          type: 'error'
        })
        return
      }

      if (props?.interactive) {
        return new Promise(resolve => {
          const id = `agent.interact-${Math.floor(Math.random() * 10000)}`
          bridge.commands.registerCommand(id, res => {
            bridge.commands.removeCommand(id)
            resolve(res)
          }, false)

          bridge.events.emit('agent.message', {
            type: 'agent',
            ...props,
            command: id
          })
        })
      } else {
        const agentMsg = {
          ...props,
          id: generateId(),
          type: props?.type || 'agent'
        }
        appendToHistory(agentMsg)
        bridge.events.emit('agent.message', agentMsg)
      }
    }

    try {
      await session.query(msg, callback)
    } catch (err) {
      bridge.events.emit('agent.message', {
        text: err.message,
        type: 'error'
      })
    }
  })
}

exports.deactivate = () => {
}
