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
 */

const TcpSocket = require('./TcpSocket')
const CasparError = require('./error/CasparError')

const EventEmitter = require('events')

const RES_HEADER_REX = /(RES (?<transaction>.+) )?(?<code>\d{3}) ((?<action>.+) )?(OK|ERROR|FAILED)/i

const RECONNECT_DELAY_MS = 1000

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

  /**
   * @type { String }
   */
  get host () {
    return this._host
  }

  /**
   * @type { Number }
   */
  get port () {
    return this._port
  }

  /**
   * @type { CasparStatusEnum }
   */
  get status () {
    return this._status
  }

  /**
   * @private
   * @type { CasparStatusEnum }
   */
  _status = Caspar.status.DISCONNECTED

  /**
   * @private
   * @type { String? }
   */
  _host = undefined

  /**
   * @private
   * @type { Number? }
   */
  _port = undefined

  /**
   * @private
   * @type { TcpSocket? }
   */
  _socket = undefined

  /**
   * @private
   * @type { Boolean }
   */
  _isProcessingData = false

  /**
   * @private
   * @type { String[] }
   */
  _unprocessedLines = []

  /**
   * @private
   * @typedef {{
   *  resolve: Function.<void>,
   *  reject: Function.<void>
   * }} Transaction
   *
   * @type { Map.<String, Transaction> }
   */
  _transactions = new Map()

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
    this._opts = opts
  }

  /**
   * @private
   */
  _tryReconnect () {
    if (this._opts.reconnect) {
      this._reconnectTimeout = setTimeout(() => {
        this.connect(this._host, this._port)
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
    if (host === this._host && port === this._port && this.status === Caspar.status.CONNECTED) {
      return
    }

    if (this._socket) {
      this._socket.teardown()
    }

    this._host = host
    this._port = port
    this._socket = new TcpSocket()

    this._setStatus(Caspar.status.CONNECTING)

    this._socket.on('connect', () => {
      this._setStatus(Caspar.status.CONNECTED)
      this.emit('connect')
    })

    this._socket.on('close', () => {
      this._setStatus(Caspar.status.DISCONNECTED)
      this.emit('disconnect')
      this._tryReconnect()
    })

    this._socket.on('error', () => {
      this._setStatus(Caspar.status.ERROR)
      this._tryReconnect()
    })

    this._socket.on('data', chunk => {
      this._processData(chunk)
    })

    this._socket.connect(host, port)
  }

  /**
   * Tear down the server
   * and any existing connection
   */
  teardown () {
    this._socket?.teardown()
    this.removeAllListeners()
  }

  /**
   * @private
   * Set a new status for
   * the caspar-instance
   * @param { CasparStatusEnum } newStatus
   */
  _setStatus (newStatus) {
    this._status = newStatus
    this.emit('status', newStatus)
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
  _resolveResponseObject (responseObject) {
    if (responseObject.code >= 200 && responseObject.code <= 299) {
      this._resolveTransaction(responseObject.transaction, responseObject)
    } else {
      this._rejectTransaction(responseObject.transaction, responseObject)
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
  _processData (chunk) {
    if (!this._unprocessedData) {
      this._unprocessedData = ''
    }

    this._unprocessedData += chunk.toString('utf8')
    const newLines = this._unprocessedData.split('\r\n')

    this._unprocessedData = newLines.pop() ?? ''
    this._unprocessedLines.push(...newLines)

    while (this._unprocessedLines.length > 0) {
      const line = this._unprocessedLines[0]
      const res = RES_HEADER_REX.exec(line)

      if (res?.groups?.code) {
        let processedLines = 1

        const resObject = {
          ...(res?.groups || {}),
          data: []
        }

        if (resObject.code === '200') {
          const indexOfTermination = this._unprocessedLines.indexOf('')
          if (indexOfTermination === -1) {
            break
          }

          resObject.data = this._unprocessedLines.slice(1, indexOfTermination)
          processedLines += resObject.data.length + 1
        } else if (resObject.code === '201' || resObject.code === '400') {
          if (this._unprocessedLines.length < 2) {
            break
          }
          resObject.data = [this._unprocessedLines[1]]
          processedLines++
        }

        this._unprocessedLines.splice(0, processedLines)
        this._resolveResponseObject(resObject)
      } else {
        /*
        Unknown error,
        skip this line
        and move on
        */
        this._unprocessedLines.splice(0, 1)
      }
    }
  }

  /**
   * @private
   * Create a new transaction
   * @returns {{ id: String, promise: Promise.<any> }} The id of the transaction as well
   *                                                   as the promise resolving it
   */
  _createTransaction () {
    const id = `B${Math.floor(Math.random() * Math.pow(10, 9))}`
    const promise = new Promise((resolve, reject) => {
      this._transactions.set(id, { resolve, reject })
    })

    return {
      id,
      promise
    }
  }

  /**
   * @private
   * Resolve a transaction
   * @param { String } id The id of the transaction to resolve
   * @param { ...args } args Any arguments to
   *                         pass to the resolve function
   */
  _resolveTransaction (id, ...args) {
    const transaction = this._transactions.get(id)
    if (!transaction) {
      return
    }
    this._transactions.delete(id)
    transaction.resolve(...args)
  }

  /**
   * @private
   * Reject a transaction
   * @param { String } id The id of the transaction to reject
   * @param { Error } err An error to reject with
   */
  _rejectTransaction (id, err) {
    const transaction = this._transactions.get(id)
    if (!transaction) {
      return
    }
    this._transactions.delete(id)
    transaction.reject(err)
  }

  /**
   * Send an AMCP payload to the server
   * @param { String } payload
   * @returns { Promise.<CasparResponse> }
   */
  send (payload) {
    if (!this._socket || this._socket.readyState !== TcpSocket.readyState.open) {
      throw new CasparError('Socket not connected', 'ERR_NOT_CONNECTED')
    }

    const { id, promise } = this._createTransaction()

    this._socket.send(`REQ ${id} ${payload}\r\n`)
    return promise
  }
}
module.exports = Caspar
