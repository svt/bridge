// SPDX-FileCopyrightText: 2022 Sveriges Television AB
//
// SPDX-License-Identifier: MIT

import React from 'react'

/**
  * A timeout delay for when
  * a connection closes
  *
  * @type { Number }
  */
const RECONNECT_TIMEOUT_MS = 500

export const useWebsocket = (url, _reconnect) => {
  const [readyState, setReadyState] = React.useState()
  const [res, setRes] = React.useState()

  const sendQueue = React.useRef([])
  const reconnect = React.useRef(_reconnect)
  const socket = React.useRef()

  React.useEffect(() => {
    function setupSocket (url) {
      const _socket = new window.WebSocket(url)

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
        setRes(e)
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
      socket.current = _socket
      setRes(undefined)
    }
    setupSocket(url)

    return () => {
      reconnect.current = false
      socket?.current?.close()
    }
  }, [])

  /**
    * Send some data over the websocket
    * This function is meant to be exposed
    * to components using this hook
    * @param { Object.<Any> } data An object to send
    */
  const send = React.useCallback(data => {
    if (socket?.current?.readyState !== 1) {
      sendQueue.current.push(data)
      return
    }
    socket.current.send(JSON.stringify(data))
  }, [])

  return [res?.data, send, readyState]
}
