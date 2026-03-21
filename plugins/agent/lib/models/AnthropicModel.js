const Anthropic = require('@anthropic-ai/sdk')
const Model = require('../Model')

const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

/**
 * @typedef {{
 *  anthropic: {
 *    apiKey: string
 *  }
 * }} AnthropicModelOpts
 */

class AnthropicModel extends Model {
  #opts
  #client
  #conversationHistory = []

  get model () {
    return this.#opts?.model || DEFAULT_MODEL
  }

  /**
   * @param { AnthropicModelOpts } opts
   */
  async initialize (opts) {
    this.#opts = opts
    this.#client = new Anthropic({
      apiKey: opts?.anthropic?.apiKey
    })
    this.resetConversation()
  }

  /**
   * Reset the conversation history
   * @override
   */
  resetConversation () {
    this.#conversationHistory = []
  }

  /**
   * List available models
   * from the Anthropic API
   * @returns { Promise<{ id: string, name: string }[]> }
   */
  async listModels () {
    if (!this.#client) {
      return []
    }
    try {
      const res = await this.#client.models.list()
      const models = []
      for await (const model of res) {
        if (model.type !== 'model') {
          continue
        }
        models.push({
          id: model.id,
          name: model.display_name || model.id
        })
      }
      return models
    } catch (_) {
      return []
    }
  }

  /**
   * Convert an MCP tool definition to
   * the Anthropic tool format
   * @param { object } tool
   * @returns { object }
   */
  #convertFromMCPTool (tool) {
    return {
      name: tool.name,
      description: tool.description,
      input_schema: tool.inputSchema
    }
  }

  /**
   * Convert an Anthropic API response to
   * the internal MCPResponse format
   * @param { object } res
   * @returns { import('../Session').MCPResponse }
   */
  #convertToMCPResponse (res) {
    const content = res.content
      .map(block => {
        if (block.type === 'text') {
          return {
            type: 'text',
            text: block.text
          }
        }
        if (block.type === 'tool_use') {
          return {
            type: 'tool_use',
            name: block.name,
            call_id: block.id,
            arguments: block.input
          }
        }
        return null
      })
      .filter(Boolean)

    return {
      id: res.id,
      model: res.model,
      content
    }
  }

  /**
   * Convert an MCP tool result to the
   * Anthropic tool_result block format
   * @param { import('../Session').MCPToolTuple } data
   * @returns { object }
   */
  #convertFromMCPToolResult (data) {
    return {
      type: 'tool_result',
      tool_use_id: data?.request?.call_id,
      content: JSON.stringify(data?.response)
    }
  }

  /**
   * Query the model
   * @param { import('../Session').MCPQuery } query
   */
  async query (query) {
    const convertedTools = (query.tools || []).map(tool => this.#convertFromMCPTool(tool))
    const messages = [...this.#conversationHistory]

    if (query.text) {
      messages.push({
        role: 'user',
        content: query.text
      })
    }

    if (query.toolResults) {
      const toolResultBlocks = query.toolResults.map(tr => this.#convertFromMCPToolResult(tr))
      messages.push({
        role: 'user',
        content: toolResultBlocks
      })
    }

    const params = {
      model: this.model,
      max_tokens: 4096,
      system: this.systemPrompt,
      messages,
      tools: convertedTools
    }

    const res = await this.#client.messages.create(params)

    /*
    Store messages for conversation context,
    then trim the oldest turns if the context
    window is getting full
    */
    this.#conversationHistory = this.trimHistory(
      [
        ...messages,
        { role: 'assistant', content: res.content }
      ],
      res.usage?.input_tokens || 0
    )

    const mcpResponse = this.#convertToMCPResponse(res)
    mcpResponse.contextUsage = this.getContextUsage(res.usage?.input_tokens || 0)
    return mcpResponse
  }
}

module.exports = AnthropicModel
