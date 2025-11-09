// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import React from 'react'

import * as messageEncoder from '../../shared/messageEncoder'

/**
  * A timeout delay for when
  * a connection closes
  *
  * @type { Number }
  */
const RECONNECT_TIMEOUT_MS = 500

/**
 * Define the interval of heartbeats
 * sent to the server to indicate that
 * the socket is alive
 *
 * This value MUST be smaller than the
 * ttl of a socket defined in the server
 *
 * Defaults to 5 seconds
 *
 * @type { Number }
 */
const HEARTBEAT_INTERVAL_MS = 5000

function createQueryString (queryParameters = {}) {
  const str = Object.entries(queryParameters)
    .filter(([, value]) => !!value)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')
  return `?${str}`
}

export const useWebsocket = (url, _reconnect, query) => {
  const [readyState, setReadyState] = React.useState()
  const [data, setData] = React.useState()

  const idRef = React.useRef()
  const refreshRef = React.useRef()

  const socketRef = React.useRef()
  const sendQueue = React.useRef([])
  const reconnect = React.useRef(_reconnect)

  React.useEffect(() => {
    function setupSocket (url) {
      const _query = {
        id: idRef.current,
        refresh: refreshRef.current,
        ...query
      }
      const _socket = new window.WebSocket(`${url}${createQueryString(_query)}`)

      window.__DISCONNECT_SOCKET = () => {
        _socket.close()
      }

      /**
        * Send all messages in the queue
        * when the socket connects
        * @type { Function.<void> }
        */
      function onOpen () {
        setReadyState(_socket.readyState)

        for (const msg of sendQueue.current) {
          _socket.send(JSON.stringify(msg))
        }
        sendQueue.current = []
        setReadyState(_socket.readyState)
      }

      /**
        * Set incoming messages to the res state
        * and trigger re-rendering of components
        * dependent on the hook
        * @param { MessageEvent } e
        */
      function onMessage (e) {
        const strData = e?.data
        try {
          const data = JSON.parse(strData)
          const decoded = messageEncoder.decodeMessage(data)
          if (decoded.type === 'id') {
            idRef.current = decoded.id
            refreshRef.current = decoded.refresh
          }
          setData(decoded)
        } catch (err) {
          console.warn('[useWebsocket]', err)
        }
      }

      /**
        * Clean up listeners on close and
        * if reconnect is set to true,
        * try reconnecting the socket
        */
      function onClose () {
        setReadyState(_socket.readyState)

        _socket.removeEventListener('open', onOpen)
        _socket.removeEventListener('close', onClose)
        _socket.removeEventListener('message', onMessage)

        if (!reconnect.current) return

        setTimeout(() => {
          setupSocket(url)
        }, RECONNECT_TIMEOUT_MS)
      }

      /*
       Attach listeners to the socket
       and assign it to the socket ref
       */
      _socket.addEventListener('open', onOpen)
      _socket.addEventListener('close', onClose)
      _socket.addEventListener('message', onMessage)
      socketRef.current = _socket
      setData(undefined)
    }

    if (typeof url !== 'string') {
      return
    }

    setupSocket(url)

    return () => {
      reconnect.current = false
      socketRef?.current?.close()
    }
  }, [url, JSON.stringify(query)])

  /**
    * Send some data over the websocket
    * This function is meant to be exposed
    * to components using this hook
    * @param { Object.<Any> } data An object to send
    */
  const send = React.useCallback(data => {
    if (socketRef?.current?.readyState !== 1) {
      sendQueue.current.push(data)
      return
    }
    const encoded = messageEncoder.encodeMessage(data)
    socketRef.current.send(JSON.stringify(encoded))
  }, [])

  React.useEffect(() => {
    if (readyState !== 1) {
      return
    }

    const ival = setInterval(() => {
      send({ type: 'heartbeat' })
    }, HEARTBEAT_INTERVAL_MS)

    return () => clearInterval(ival)
  }, [readyState])

  return [data, send, readyState]
}
