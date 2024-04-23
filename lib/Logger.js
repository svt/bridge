// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

const DEFAULT_LOG_LEVEL = process.env.LOG_LEVEL || 'debug'

function defaultFormatter (type, logger, ctx, ...args) {
  return [`${type} [${logger.meta?.name}]${ctx?.caller ? ` (${ctx.caller})` : ''}`, ...args]
}

class Logger {
  /**
   * @private
   * @type { Function.<String[]> }
   */
  #formatter

  /**
   * @private
   * @type { Logger | undefined }
   */
  static #instance

  /**
   * Get the singleton instance
   * of this class
   * @returns { Logger }
   */
  static getInstance () {
    if (!this.#instance) {
      this.#instance = new Logger({ name: 'global' })
    }
    return this.#instance
  }

  /**
   * An enumeration of the
   * available logging levels
   * @type { Object.<String, Number> }
   */
  static get levels () {
    return Object.freeze({
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    })
  }

  /**
   * A map of helper functions
   * for coloring strings
   * @type { Object.<String, (String) => String> }
   */
  static get color () {
    return Object.freeze({
      red: str => Logger.#color(str, '\x1b[31m'),
      yellow: str => Logger.#color(str, '\x1b[33m'),
      blue: str => Logger.#color(str, '\x1b[34m'),
      cyan: str => Logger.#color(str, '\x1b[36m')
    })
  }

  /**
   * @private
   */
  static #color (str, color) {
    return `${color}${str}\x1b[0m`
  }

  /**
   * Prefer creating a custom logger before
   * using this static function
   *
   * A static implementation of debug logging,
   * using the default singleton logger instance
   * @param {...any} args
   */
  static debug (...args) {
    Logger.getInstance().debug(...args)
  }

  /**
   * Prefer creating a custom logger before
   * using this static function
   *
   * A static implementation of info logging,
   * using the default singleton logger instance
   * @param {...any} args
   */
  static info (...args) {
    Logger.getInstance().info(...args)
  }

  /**
   * Prefer creating a custom logger before
   * using this static function
   *
   * A static implementation of warn logging,
   * using the default singleton logger instance
   * @param {...any} args
   */
  static warn (...args) {
    Logger.getInstance().warn(...args)
  }

  /**
   * Prefer creating a custom logger before
   * using this static function
   *
   * A static implementation of error logging,
   * using the default singleton logger instance
   * @param {...any} args
   */
  static error (...args) {
    Logger.getInstance().error(...args)
  }

  /**
   * Prefer creating a custom logger before
   * using this static function
   *
   * A static implementation of raw logging that will
   * log the input without applying any formatter
   * using the default singleton logger instance
   * @param {...any} args
   */
  static raw (...args) {
    Logger.getInstance().raw(...args)
  }

  /**
   * Log a debug message
   * @param {...any} args
   */
  debug (...args) {
    if (this.level > Logger.levels.debug) return
    const formatted = this.#formatter(Logger.color.blue('debug'), this, {}, ...args)
    console.log(...formatted)
  }

  /**
   * Log an info message
   * @param {...any} args
   */
  info (...args) {
    if (this.level > Logger.levels.info) return
    const formatted = this.#formatter(Logger.color.cyan('info'), this, {}, ...args)
    console.info(...formatted)
  }

  /**
   * Log a warn message
   * @param {...any} args
   */
  warn (...args) {
    if (this.level > Logger.levels.warn) return
    const formatted = this.#formatter(Logger.color.yellow('warn'), this, { caller: this.#getCallerFile() }, ...args)
    console.warn(...formatted)
  }

  /**
   * Log an error message
   * @param {...any} args
   */
  error (...args) {
    if (this.level > Logger.levels.error) return
    const formatted = this.#formatter(Logger.color.red('error'), this, {}, ...args)
    console.error(...formatted)
  }

  /**
   * Log some data without
   * applying a formatter
   * @param {...any} args
   */
  raw (...args) {
    console.log(...args)
  }

  /**
   * @private
   * Get the caller file
   * of the function
   *
   * This is useful for debugging
   *
   * @returns { String }
   */
  #getCallerFile () {
    const original = Error.prepareStackTrace
    let callerFile

    try {
      const err = new Error()
      Error.prepareStackTrace = function (_, stack) {
        return stack
      }

      const currentFile = err.stack.shift().getFileName()

      while (err.stack.length) {
        callerFile = err.stack.shift().getFileName()
        if (currentFile !== callerFile) {
          break
        }
      }
    } catch (_) {}

    Error.prepareStackTrace = original
    return callerFile
  }

  /**
   * Create a new logger
   * @param { Object.<String, any> } meta Any additional data to make
   *                                      available to the logger
   * @param { Number } level The log level to use for this specific logger,
   *                         will default to the LOG_LEVEL env variable or 'debug'
   * @param { (String, Logger, ...any) => any[] } formatter An optional formatter function
   */
  constructor (
    meta = {},
    level = Logger.levels[DEFAULT_LOG_LEVEL],
    formatter = defaultFormatter
  ) {
    /**
     * Metadata for
     * this logger
     * @type {{
     *  name: String
     * }}
     */
    this.meta = meta

    /**
     * This logger's level,
     * changing this value will
     * change the type of future
     * messages being logged
     */
    this.level = level

    this.#formatter = formatter
  }
}

module.exports = Logger
