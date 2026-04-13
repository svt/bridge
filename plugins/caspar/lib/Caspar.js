// SPDX-FileCopyrightText: 2023 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

/**
 * @typedef {{
 *  reconnect: Boolean?
 * }} CasparOpts
 *
 * @typedef {
 *  'ERROR' | 'CONNECTING' | 'CONNECTED' | 'DISCONNECTED'
 * } CasparStatusEnum
 *
 * @typedef {
 *  'DEFAULT' | 'COMPATIBILITY'
 * } CasparModeEnum
 *
 * @typedef {{
 *  id: number,
 *  frameRate: string
 * }} CasparChannel
 *
 * @typedef {{
 *  videoMode: string,
 *  consumers: Object | undefined
 * }} CasparConfigChannel
 *
 * @typedef {{
 *  mediaPath: string | undefined,
 *  logPath: string | undefined,
 *  templatePath: string | undefined,
 *  dataPath: string | undefined
 * }} CasparConfigPaths
 *
 * @typedef {{
 *  id: string,
 *  timeScale: string,
 *  duration: string
 * }} CasparConfigVideoMode
 *
 * @typedef {{
 *  channels: { channel: CasparConfigChannel | CasparConfigChannel[] } | undefined,
 *  videoModes: { videoMode: CasparConfigVideoMode | CasparConfigVideoMode[] } | undefined,
 *  paths: CasparConfigPaths | undefined
 * }} CasparConfiguration
 */

const TcpSocket = require('./TcpSocket')
const XmlParser = require('./XmlParser')
const CasparError = require('./error/CasparError')

const Logger = require('../../../lib/Logger')
const logger = new Logger({ name: 'CasparPlugin/Caspar' })

const EventEmitter = require('events')

const RES_HEADER_REX = /(RES (?<transaction>.+) )?(?<code>\d{3}) ((?<action>.+) )?(OK|ERROR|FAILED)/i

const RECONNECT_DELAY_MS = 1000

/**
 * Define how long a transaction can be
 * open and waiting for a response before
 * being timed out
 * @type { Number }
 */
const TIMEOUT_TRANSACTIONS_MS = 30000

/**
 * Define how often the timeout check
 * for transactions should be performed
 * @type { Number }
 */
const TIMEOUT_TRANSACTIONS_INTERVAL_MS = 1000

/**
 * Known frame rates for named video modes
 * @type { Object.<string, number> }
 */
const NAMED_MODE_FRAMERATES = {
  pal: 25,
  ntsc: 30000 / 1001,
  ntsc2398: 24000 / 1001
}

/**
 * Extract the frame rate in fps from a standard CasparCG
 * video mode name such as '1080i5000' or '720p2997'.
 * Returns undefined for unrecognised mode names.
 * @param { string } modeName
 * @returns { number | undefined }
 */
function parseFrameRateFromMode (modeName) {
  const lower = modeName.toLowerCase()
  if (NAMED_MODE_FRAMERATES[lower] !== undefined) {
    return NAMED_MODE_FRAMERATES[lower]
  }
  const match = lower.match(/[pi](\d+)$/)
  if (match) {
    return parseInt(match[1]) / 100
  }
  return undefined
}

/**
 * @class Caspar
 *
 * @typedef {{
 *  code: Number,
 *  data: any
 * }} CasparResponse
 */
class Caspar extends EventEmitter {
  static status = Object.freeze({
    DISCONNECTED: 'DISCONNECTED',
    CONNECTING: 'CONNECTING',
    CONNECTED: 'CONNECTED',
    ERROR: 'ERROR'
  })

  static mode = Object.freeze({
    DEFAULT: 'DEFAULT',
    COMPATIBILITY: 'COMPATIBILITY'
  })

  /**
   * @type { String }
   */
  get host () {
    return this.#host
  }

  /**
   * @type { Number }
   */
  get port () {
    return this.#port
  }

  /**
   * @type { CasparStatusEnum }
   */
  get status () {
    return this.#status
  }

  /**
   * @private
   * @type { CasparModeEnum }
   */
  #mode = Caspar.mode.DEFAULT

  /**
   * @type { CasparModeEnum }
   */
  get mode () {
    return this.#mode
  }

  /**
   * @type { CasparModeEnum }
   */
  set mode (newValue) {
    this.#mode = newValue
  }

  /**
   * @private
   * @type { CasparStatusEnum }
   */
  #status = Caspar.status.DISCONNECTED

  /**
   * @private
   * @type { String | undefined }
   */
  #host = undefined

  /**
   * @private
   * @type { Number | undefined }
   */
  #port = undefined

  /**
   * @private
   * @type { TcpSocket | undefined }
   */
  #socket = undefined

  /**
   * @private
   * @type { string[] }
   */
  #unprocessedLines = []

  /**
   * @private
   * @type { string? }
   */
  #unprocessedData = undefined

  /**
   * @private
   * @type { any? }
   */
  #opts

  /**
   * @private
   * @type { CasparChannel[]? }
   */
  #channels

  get channels () {
    return this.#channels
  }

  /**
   * @private
   * @typedef {{
   *  resolve: Function.<void>,
   *  reject: Function.<void>,
   *  timestamp: Number
   * }} Transaction
   *
   * @type { Map.<String, Transaction> }
   */
  #transactions = new Map()

  #transactionTimeoutInterval

  /**
   * Create a new instance of the client
   * and connect to the specified server
   * @param { CasparOpts } opts
   */
  constructor (opts = {}) {
    super()
    /**
     * @private
     * @type { CasparOpts }
     */
    this.#opts = opts

    /*
     * Clear any unfinished transactions
     * using an interval to avoid zombie
     * objects
     */
    this.#transactionTimeoutInterval = setInterval(() => this.#timeoutTransactions(), TIMEOUT_TRANSACTIONS_INTERVAL_MS)
  }

  /**
   * @private
   */
  #tryReconnect () {
    if (this.#opts.reconnect) {
      this._reconnectTimeout = setTimeout(() => {
        this.connect(this.#host, this.#port)
      }, RECONNECT_DELAY_MS)
    }
  }

  /**
   * Connect this server to a host and port,
   * will terminate any existing connection
   * @param { String } host
   * @param { Number } port
   */
  connect (host, port) {
    if (!host || !port) {
      return
    }

    if (this._reconnectTimeout) {
      clearTimeout(this._reconnectTimeout)
      this._reconnectTimeout = undefined
    }

    /*
    If already connected
    skip setting up a new socket
    */
    if (host === this.#host && port === this.#port && this.status === Caspar.status.CONNECTED) {
      return
    }

    if (this.#socket) {
      this.#socket.teardown()
    }

    this.#host = host
    this.#port = port
    this.#socket = new TcpSocket()

    this.#setStatus(Caspar.status.CONNECTING)

    this.#socket.on('connect', async () => {
      this.#channels = await this.#getChannels()
      this.#setStatus(Caspar.status.CONNECTED)
      this.emit('connect')
    })

    this.#socket.on('close', () => {
      this.#setStatus(Caspar.status.DISCONNECTED)
      this.emit('disconnect')
      this.#tryReconnect()
    })

    this.#socket.on('error', () => {
      this.#setStatus(Caspar.status.ERROR)
      this.#tryReconnect()
    })

    this.#socket.on('data', chunk => {
      this.#processData(chunk)
    })

    this.#socket.connect(host, port)
  }

  /**
   * Tear down the server
   * and any existing connection
   */
  teardown () {
    this.#socket?.teardown()
    this.removeAllListeners()
    clearInterval(this.#transactionTimeoutInterval)
  }

  /**
   * @private
   * Set a new status for
   * the caspar-instance
   * @param { CasparStatusEnum } newStatus
   */
  #setStatus (newStatus) {
    this.#status = newStatus
    this.emit('status', newStatus)
  }

  async #getChannels () {
    const [res, config] = await Promise.all([
      this.send('INFO'),
      this.#getConfig()
    ])

    if (res.code !== '200') {
      logger.debug('Failed to get channel info')
      return
    }

    if (!Array.isArray(res?.data)) {
      logger.debug('Received invalid channel info')
      return
    }

    /*
    Build a lookup of custom video modes from the config,
    keyed by lower-case id. Frame rate = timescale / duration.
    */
    const customModes = {}
    const rawModes = config?.videoModes?.videoMode
    if (rawModes) {
      const modeArray = Array.isArray(rawModes) ? rawModes : [rawModes]
      for (const mode of modeArray) {
        if (mode.id && mode.timeScale && mode.duration) {
          customModes[mode.id.toLowerCase()] = parseInt(mode.timeScale) / parseInt(mode.duration)
        }
      }
    }

    return res.data
      .map(line => {
        const match = line.match(/^(\d+)\s+(\S+)\s+(\S+)$/)
        if (!match) return null
        const [, id, videoMode] = match
        const frameRate = customModes[videoMode.toLowerCase()] ?? parseFrameRateFromMode(videoMode)
        return { id: parseInt(id), videoMode, frameRate }
      })
      .filter(Boolean)
  }

  /**
   * Get the configuration of this server
   *
   * @returns { Promise.<CasparConfiguration> } An object representing the
   *                                            server's configuration
   */
  async #getConfig () {
    const config = await this.send('INFO CONFIG')
    if (config.code !== '201') {
      logger.warn('Failed to get configuration')
      return
    }
    const xml = config?.data?.[0]
    return XmlParser.parse(xml)?.configuration
  }

  /**
   * @private
   * Resolve a response
   * object from Caspar
   * @param {{
   *  status: String | Number,
   *  action: String
   * }} responseObject
   */
  #resolveResponseObject (responseObject) {
    if (responseObject?.code >= 200 && responseObject?.code <= 299) {
      this.#resolveTransaction(responseObject?.transaction, responseObject)
    } else {
      this.#rejectTransaction(responseObject?.transaction, responseObject)
    }
  }

  /**
   * @private
   * This function processes data received
   * as a response from Caspar by bundling chunks
   * together and producing a response object,
   * which is the resolved through the
   * matching transaction
   *
   * The parsing step is inspired by
   * the caspar connector written by
   * SuperflyTV
   *
   * @see https://github.com/SuperFlyTV/casparcg-connection/blob/master/src/connection.ts
   *
   * @todo Refactor this into
   *       something more readable
   */
  #processData (chunk) {
    if (!this.#unprocessedData) {
      this.#unprocessedData = ''
    }

    this.#unprocessedData += chunk.toString('utf8')
    const newLines = this.#unprocessedData.split('\r\n')

    this.#unprocessedData = newLines.pop() ?? ''
    this.#unprocessedLines.push(...newLines)

    while (this.#unprocessedLines.length > 0) {
      const line = this.#unprocessedLines[0]
      const res = RES_HEADER_REX.exec(line)

      if (res?.groups?.code) {
        let processedLines = 1

        const resObject = {
          ...(res?.groups || {}),
          data: []
        }

        if (resObject.code === '200') {
          const indexOfTermination = this.#unprocessedLines.indexOf('')
          if (indexOfTermination === -1) {
            break
          }

          resObject.data = this.#unprocessedLines.slice(1, indexOfTermination)
          processedLines += resObject.data.length + 1
        } else if (resObject.code === '201' || resObject.code === '400') {
          if (this.#unprocessedLines.length < 2) {
            break
          }
          resObject.data = [this.#unprocessedLines[1]]
          processedLines++
        }

        this.#unprocessedLines.splice(0, processedLines)
        this.#resolveResponseObject(resObject)
      } else {
        /*
        Unknown error,
        skip this line
        and move on
        */
        this.#unprocessedLines.splice(0, 1)
      }
    }
  }

  /**
   * @private
   * Create a new transaction
   * @returns {{ id: String, promise: Promise.<any> }} The id of the transaction as well
   *                                                   as the promise resolving it
   */
  #createTransaction () {
    const id = `B${Math.floor(Math.random() * Math.pow(10, 9))}`
    const promise = new Promise((resolve, reject) => {
      this.#transactions.set(id, { resolve, reject, timestamp: Date.now() })
    })

    return {
      id,
      promise
    }
  }

  /**
   * Resolve a transaction
   * @param { String } id The id of the transaction to resolve
   * @param { ...args } args Any arguments to
   *                         pass to the resolve function
   */
  #resolveTransaction (id, ...args) {
    const transaction = this.#transactions.get(id)
    if (!transaction) {
      return
    }
    this.#transactions.delete(id)
    transaction.resolve(...args)
  }

  /**
   * Reject a transaction
   * @param { String } id The id of the transaction to reject
   * @param { Error } err An error to reject with
   */
  #rejectTransaction (id, err) {
    const transaction = this.#transactions.get(id)
    if (!transaction) {
      return
    }
    this.#transactions.delete(id)
    transaction.reject(err)
  }

  /**
   * Send an AMCP payload to the server
   * @param { String } payload
   * @returns { Promise.<CasparResponse> }
   */
  send (payload) {
    if (!this.#socket || this.#socket?.readyState !== TcpSocket.readyState.open) {
      throw new CasparError('Socket not connected', 'ERR_NOT_CONNECTED')
    }

    /*
    Skip the REQ parameter if
    running in compatibility mode
    as it's not supported prior to
    CasparCG version 2.1.0

    Doing this will have the side effect
    of preventing Bridge from interpreting
    any response that's returned from the
    server but allow for sending commands
    */
    if (this.mode === Caspar.mode.COMPATIBILITY) {
      this.#socket.send(`${payload}\r\n`)
      return Promise.resolve()
    }

    const { id, promise } = this.#createTransaction()
    this.#socket.send(`REQ ${id} ${payload}\r\n`)
    return promise
  }

  /**
   * Time out any transactions that are running for too long,
   * according to TIMEOUT#transactions_DELAY_MS
   */
  #timeoutTransactions () {
    const now = Date.now()
    this.#transactions.entries().forEach(([id, transaction]) => {
      if (now - transaction.timestamp < TIMEOUT_TRANSACTIONS_MS) {
        return
      }
      this.#rejectTransaction(id, new Error('Transaction timed out'))
    })
  }
}
module.exports = Caspar
