const { Client } = require('@modelcontextprotocol/sdk/client')
const SessionError = require('./errors/SessionError')

/**
 * @typedef {{
 *  text: string
 * }} UserQuery
 *
 * @typedef {{
 *  text: string,
 *  model: string
 * }} SessionResponse
 *
 * @typedef {{
 *  name: string,
 *  arguments: any
 * }} MCPToolRequest
 *
 * @typedef { any | undefined } MCPToolResponse
 *
 * @typedef {{
 *  request: MCPToolRequest,
 *  response: MCPToolResponse
 * }} MCPToolTuple
 *
 * @typedef {{
 *  type: 'text' | 'tool_use',
 *  name: string | undefined,
 *  arguments: any | undefined,
 *  text: string | undefined
 * }} MCPResponseContent
 *
 * @typedef {{
 *  id: string,
 *  model: string,
 *  content: MCPResponseContent[]
 * }} MCPResponse
 *
 * @typedef {{
 *  text: string,
 *  previousQuery: MCPQuery | undefined,
 *  previousResponse: MCPResponse,
 *  tools: any[],
 *  toolResponses: MCPToolTuple[]
 * }} MCPQuery
 */

const QUERY_LOOP_MAX_ITERATIONS = 10

class Session {
  #clients = new Map()
  #model

  #authDetails = {}

  addAuthDetailForTool (toolName, obj = {}) {
    this.#authDetails[toolName] = obj
  }

  getAuthDetail (toolName) {
    return this.#authDetails[toolName]
  }

  async addClient (id, transport) {
    const client = new Client({
      name: 'bridge',
      version: '1.0.0'
    })

    await client.connect(transport)
    this.#clients.set(id, client)
  }

  /**
   * Set the model to
   * use for this session
   * @param { import('./Model').Model } model
   */
  setModel (model) {
    this.#model = model
  }

  async #authorizeTool (message, callback) {
    const res = await callback(null, {
      interactive: true,
      type: 'confirm',
      text: message
    })
    return res
  }

  async #queryLoop (query, callback, iterator = 0) {
    const res = await this.#model.query(query)
    const toolResults = []

    for (const content of res.content) {
      if (content.type === 'text') {
        callback(null, {
          model: this.#model?.model,
          text: content.text,
          contextUsage: res.contextUsage
        })
      } else if (content.type === 'tool_use') {
        const auth = this.getAuthDetail(content.name)

        /*
        If tool isn't explicitly allowed to run without user consent,
        prompt the user to authorize it
        */
        if (auth?.requiresAuth !== false) {
          const message = auth?.authMessage || `Allow tool ${content.name}?`
          const userAuthorized = await this.#authorizeTool(message, callback)

          if (!userAuthorized) {
            toolResults.push({
              request: content,
              response: { error: 'User did not approve request to use tool' }
            })
            continue
          }
        }

        const toolRes = await this.callRoutedTool(content.name, content.arguments)

        if (toolRes) {
          await callback(null, {
            interactive: false,
            type: 'toolUse',
            text: auth?.usageDescription || content.name
          })

          toolResults.push({
            request: content,
            response: toolRes
          })
        }
      }
    }

    if (iterator === QUERY_LOOP_MAX_ITERATIONS - 1) {
      callback(null, {
        model: this.#model?.model,
        text: ''
      })
      return
    }

    if (toolResults.length) {
      await this.#queryLoop({
        previousQuery: query,
        previousResponse: res,
        toolResults,
        tools: query?.tools || []
      }, callback, iterator + 1)
    }
  }

  /**
   * @param { Query } userQuery
   * @returns { SessionResponse }
   */
  async query (userQuery, callback = () => {}) {
    if (!userQuery?.text || typeof userQuery?.text !== 'string') {
      return
    }

    if (!this.#model) {
      throw new SessionError('No model is set for this session', SessionError.code.ERR_MISSING_MODEL)
    }

    const tools = await this.getAllTools()

    const query = {
      text: userQuery.text,
      tools
    }

    await this.#queryLoop(query, callback)
  }

  async getAllTools () {
    const out = []
    for (const [id, client] of this.#clients.entries()) {
      const res = await client.listTools()
      const taggedTools = res.tools.map(tool => ({
        ...tool,
        name: `${id}_${tool.name}`
      }))
      out.push(...taggedTools)
    }
    return out
  }

  async getTool (fullName) {
    const [clientId, ...toolNameParts] = fullName.split('_')
    const toolName = toolNameParts.join('_')

    const client = this.#clients.get(clientId)
    if (!client) {
      throw new Error(`Client with id ${clientId} not found`)
    }

    const { tools } = await client.listTools()
    const tool = tools.find(tool => tool.name === toolName)

    return tool
  }

  async callRoutedTool (fullName, args) {
    const [clientId, ...toolNameParts] = fullName.split('_')
    const toolName = toolNameParts.join('_')

    const client = this.#clients.get(clientId)
    if (!client) {
      throw new Error(`Client with id ${clientId} not found`)
    }

    return client.callTool({
      name: toolName,
      arguments: args
    })
  }

  async terminate () {
    for (const client of this.#clients.values()) {
      await client.close()
    }
    this.#clients.clear()
  }
}

module.exports = Session
