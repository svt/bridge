const CONTEXT_TRIM_HIGH_WATERMARK = 0.8
const CONTEXT_TRIM_LOW_WATERMARK = 0.6

const SYSTEM_PROMPT = `
  You are controlling a piece of software called Bridge, a playout application used in the television and media industry to create and manage live graphics.
  Several tools are available to you. Always use them to complete tasks — do not instruct the user to do things themselves.

  These are the core entities you interact with, represented as JSON objects in the tools:
  - Items are individual elements placed in a rundown or group and played through the software. Examples include nameplates, lower thirds, media items, images, videos, variables, triggers and generic templates.
  - Types are blueprints for items and describe what data an item can hold, expressed using dot-notation property paths.

  Rules you must follow:
  - Be kind and professional.
  - Your name is Bridget.
  - Complete tasks directly using tools rather than giving the user step-by-step instructions.
  - Keep answers short and concise.
  - You are allowed to make reasonable assumptions about data not explicitly stated by the user when creating items.
  - Always call get_type_by_id before creating an item to understand its available fields before setting any properties.
  - Prefer batch operations — create or update multiple items in a single tool call whenever possible.
  - Some property fields support variables, written as $(variable name). Only use this syntax when the type definition indicates the field allows variables.
  - If a tool returns an error or an empty result, inform the user clearly and do not proceed as if the operation succeeded.
`

class Model {
  get model () {
    return 'Unknown'
  }

  get systemPrompt () {
    return SYSTEM_PROMPT
  }

  get contextWindow () {
    return 128000
  }

  /**
   * Calculate the fraction of the context
   * window used by the given token count
   * @param { number } inputTokens
   * @returns { number } value between 0 and 1
   */
  getContextUsage (inputTokens) {
    return inputTokens / this.contextWindow
  }

  async initialize (opts) {

  }

  /**
   * Reset the conversation history
   * for this model, called before
   * each new user turn
   */
  resetConversation () {}

  /**
   * List available models
   * from the provider
   * @returns { Promise<{ id: string, name: string }[]> }
   */
  async listModels () {
    return []
  }

  async query () {

  }

  /**
   * Drop the oldest user turn from the history
   * when input tokens exceed 80% of the context
   * window, repeat until under 60%
   *
   * @param { object[] } history
   * @param { number } inputTokens
   * @returns { object[] }
   */
  trimHistory (history, inputTokens) {
    const high = this.contextWindow * CONTEXT_TRIM_HIGH_WATERMARK
    const low = this.contextWindow * CONTEXT_TRIM_LOW_WATERMARK

    if (inputTokens <= high) {
      return history
    }

    let current = inputTokens
    const trimmed = [...history]
    const tokensPerMessage = inputTokens / history.length

    /*
    Find the start of the next user turn and
    remove everything before it, repeating until
    the estimated token count is below the low watermark
    */
    while (current > low && trimmed.length >= 2) {
      const isNotFirst = (_, i) => i > 0
      const isUserMessage = message => message.role === 'user'
      const nextUserIdx = trimmed.findIndex((message, i) => isNotFirst(message, i) && isUserMessage(message))

      if (nextUserIdx === -1) {
        break
      }

      const removed = trimmed.splice(0, nextUserIdx)
      current -= tokensPerMessage * removed.length
    }
    return trimmed
  }
}

module.exports = Model
