const OpenAI = require('openai')
const Model = require('../Model')
const z = require('zod')

const DEFAULT_MODEL = 'gpt-4o-mini'

/**
 * Model ID prefixes known to support
 * the Responses API with tools and
 * built-in web_search
 *
 * @type { string[] }
 */
const SUPPORTED_MODEL_PATTERNS = [
  'gpt-4o',
  'gpt-4.1',
  'o3',
  'o4'
]

/**
 * @typedef {{
 *  openai: {
 *    apiKey: string
 *  }
 * }} OpenAIModelOpts
 */

const OUTPUT_TYPE_TRANSLATIONS = {
  message: obj => {
    return {
      type: 'text',
      text: (obj?.content || [])
        .filter(item => item?.type === 'output_text')
        .map(item => item?.text)
        .join('\n')
    }
  },
  output_text: obj => {
    return {
      type: 'text',
      text: obj?.text
    }
  },
  function_call: obj => {
    return {
      type: 'tool_use',
      name: obj?.name,
      call_id: obj?.call_id,
      arguments: JSON.parse(obj?.arguments)
    }
  }
}

class OpenAIModel extends Model {
  #opts
  #client
  #conversationInput = []

  get model () {
    return this.#opts?.model || DEFAULT_MODEL
  }

  /**
   * @param { OpenAIModelOpts } opts
   */
  async initialize (opts) {
    this.#opts = opts
    this.#client = new OpenAI({
      apiKey: opts?.openai?.apiKey
    })
    this.resetConversation()
  }

  /**
   * Reset the conversation history
   * @override
   */
  resetConversation () {
    this.#conversationInput = []
  }

  /**
   * List available models
   * from the OpenAI API
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
        const id = model.id.toLowerCase()
        const supported = SUPPORTED_MODEL_PATTERNS.some(p => id.startsWith(p))
        if (!supported) {
          continue
        }
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
   * the OpenAI Responses API function format
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
      name: tool.name,
      description: tool.description,
      parameters: schema,
      strict: false
    }
  }

  /**
   * Convert an OpenAI Responses API response to
   * the internal MCPResponse format
   * @param { object } res
   * @returns { import('../Session').MCPResponse }
   */
  #convertToMCPResponse (res) {
    return {
      id: res.id,
      model: res.model,
      content: res.output
        .filter(output => OUTPUT_TYPE_TRANSLATIONS[output.type])
        .map(output => {
          return OUTPUT_TYPE_TRANSLATIONS[output.type](output)
        })
    }
  }

  /**
   * Convert an MCP tool result to the
   * OpenAI function_call_output format
   * @param { import('../Session').MCPToolTuple } data
   * @returns { object }
   */
  #convertFromMCPToolResult (data) {
    return {
      type: 'function_call_output',
      call_id: data?.request?.call_id,
      output: JSON.stringify(data?.response)
    }
  }

  /**
   * Query the model
   * @param { import('../Session').MCPQuery } query
   */
  async query (query) {
    const convertedTools = (query.tools || []).map(tool => this.#convertFromMCPTool(tool))
    const defaultTools = [
      { type: 'web_search' }
    ]

    if (query.text) {
      this.#conversationInput.push({
        role: 'user',
        content: query.text
      })
    }

    if (query.toolResults) {
      for (const toolResult of query.toolResults) {
        this.#conversationInput.push(this.#convertFromMCPToolResult(toolResult))
      }
    }

    const params = {
      model: this.model,
      instructions: this.systemPrompt,
      input: this.#conversationInput,
      tools: [...defaultTools, ...convertedTools],
      store: false
    }

    const res = await this.#client.responses.create(params)

    /*
    Append the model's output items to the conversation
    so tool follow-ups have the full context, then trim
    the oldest turns if the context window is getting full
    */
    this.#conversationInput.push(...res.output)
    this.#conversationInput = this.trimHistory(
      this.#conversationInput,
      res.usage?.input_tokens || 0
    )

    const mcpResponse = this.#convertToMCPResponse(res)
    mcpResponse.contextUsage = this.getContextUsage(res.usage?.input_tokens || 0)
    return mcpResponse
  }
}

module.exports = OpenAIModel
