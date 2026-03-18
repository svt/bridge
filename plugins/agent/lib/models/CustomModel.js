const OpenAI = require('openai')
const Model = require('../Model')
const z = require('zod')

/**
 * A custom model that connects to any
 * OpenAI-compatible HTTP endpoint,
 * such as Ollama, LM Studio or vLLM
 *
 * @typedef {{
 *  custom: {
 *    baseUrl: string,
 *    apiKey: string
 *  }
 * }} CustomModelOpts
 */

class CustomModel extends Model {
  #opts
  #client
  #conversationHistory = []

  get model () {
    return this.#opts?.model || ''
  }

  /**
   * @param { CustomModelOpts } opts
   */
  async initialize (opts) {
    this.#opts = opts
    this.#client = new OpenAI({
      baseURL: opts?.custom?.baseUrl,
      apiKey: opts?.custom?.apiKey || 'not-needed'
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
   * List available models from
   * the remote endpoint
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
        models.push({
          id: model.id,
          name: model.id
        })
      }
      return models
    } catch (_) {
      return []
    }
  }

  /**
   * Convert an MCP tool definition to
   * the OpenAI Chat Completions tool format
   * @param { object } tool
   * @returns { object }
   */
  #convertFromMCPTool (tool) {
    const schema = z.fromJSONSchema(tool.inputSchema).toJSONSchema({
      override: ctx => {
        ctx.jsonSchema.additionalProperties = false
      }
    })

    return {
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: schema
      }
    }
  }

  /**
   * Convert an OpenAI Chat Completions response to
   * the internal MCPResponse format
   * @param { object } res
   * @returns { import('../Session').MCPResponse }
   */
  #convertToMCPResponse (res) {
    const content = []
    const message = res.choices?.[0]?.message

    if (message?.content) {
      content.push({
        type: 'text',
        text: message.content
      })
    }

    if (message?.tool_calls) {
      for (const call of message.tool_calls) {
        content.push({
          type: 'tool_use',
          name: call.function.name,
          call_id: call.id,
          arguments: JSON.parse(call.function.arguments)
        })
      }
    }

    return {
      id: res.id,
      model: res.model,
      content
    }
  }

  /**
   * Convert an MCP tool result to the
   * OpenAI Chat Completions tool message format
   * @param { import('../Session').MCPToolTuple } data
   * @returns { object }
   */
  #convertFromMCPToolResult (data) {
    return {
      role: 'tool',
      tool_call_id: data?.request?.call_id,
      content: JSON.stringify(data?.response)
    }
  }

  /**
   * Query the model using the
   * OpenAI-compatible Chat Completions API
   * @param { import('../Session').MCPQuery } query
   */
  async query (query) {
    const convertedTools = (query.tools || []).map(tool => this.#convertFromMCPTool(tool))
    const messages = [
      { role: 'system', content: this.systemPrompt },
      ...this.#conversationHistory
    ]

    if (query.text) {
      messages.push({
        role: 'user',
        content: query.text
      })
    }

    if (query.toolResults) {
      for (const toolResult of query.toolResults) {
        messages.push(this.#convertFromMCPToolResult(toolResult))
      }
    }

    const params = {
      model: this.model,
      messages
    }

    if (convertedTools.length > 0) {
      params.tools = convertedTools
    }

    const res = await this.#client.chat.completions.create(params)

    /*
    Store messages for conversation context,
    then trim the oldest turns if the context
    window is getting full
    */
    const assistantMessage = res.choices?.[0]?.message
    if (assistantMessage) {
      this.#conversationHistory = this.trimHistory(
        [...messages.slice(1), assistantMessage],
        res.usage?.prompt_tokens || 0
      )
    }

    const mcpResponse = this.#convertToMCPResponse(res)
    mcpResponse.contextUsage = this.getContextUsage(res.usage?.prompt_tokens || 0)
    return mcpResponse
  }
}

module.exports = CustomModel
