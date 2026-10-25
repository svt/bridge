import React from 'react'
import * as api from '../../api'

import { Modal } from '../Modal'
import { Field, clean, getMissing } from './SchemaForm'

import './style.css'

export const OPEN_EVENT = 'commandModal.open'

/**
 * Renders a form for the arguments of a command
 * requested through the OPEN_EVENT event
 */
export function CommandModal () {
  const [command, setCommand] = React.useState()
  const [open, setOpen] = React.useState(false)
  const [args, setArgs] = React.useState([])
  const [error, setError] = React.useState()
  const [result, setResult] = React.useState()
  const [running, setRunning] = React.useState(false)

  React.useEffect(() => {
    let bridge

    function onOpen (next) {
      setCommand(next)
      setArgs([])
      setError(undefined)
      setResult(undefined)
      setOpen(true)
    }

    async function setup () {
      bridge = await api.load()
      bridge.events.on(OPEN_EVENT, onOpen)
    }
    setup()

    return () => bridge?.events.off(OPEN_EVENT, onOpen)
  }, [])

  const schemas = command?.args?.prefixItems || []
  const minItems = command?.args?.minItems ?? 0

  async function handleSubmit (e) {
    e.preventDefault()

    const values = args.map(clean)
    while (values.length > 0 && values[values.length - 1] === undefined) values.pop()

    const missing = []
    schemas.forEach((schema, i) => {
      if (i < minItems && values[i] === undefined) missing.push(schema.title || `Argument ${i + 1}`)
      else missing.push(...getMissing(schema, values[i]))
    })
    if (missing.length) {
      setError(`Missing: ${missing.join(', ')}`)
      return
    }

    setRunning(true)
    setError(undefined)
    try {
      const bridge = await api.load()
      const res = await bridge.commands.executeCommand(command.id, ...values)
      bridge.messages.createSuccessMessage({ text: `${command.id}: Done` })
      if (res === undefined) {
        setOpen(false)
      } else {
        setResult(res)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Modal open={open} size='small' onClose={() => setOpen(false)}>
      <form className='SchemaForm' onSubmit={handleSubmit}>
        <div className='SchemaForm-body'>
          <h3 className='SchemaForm-title'>Run command: {command?.label || command?.id}</h3>
          { command?.description && <p className='SchemaForm-hint'>{command.description}</p> }
          {
            result !== undefined
              ? <pre className='SchemaForm-result'>{JSON.stringify(result, null, 2)}</pre>
              : schemas.map((schema, i) => (
                <Field
                  key={i}
                  label={`Argument ${i + 1}`}
                  schema={schema}
                  required={i < minItems}
                  value={args[i]}
                  onChange={next => setArgs(prev => {
                    const copy = [...prev]
                    copy[i] = next
                    return copy
                  })}
                />
              ))
          }
          { error && <div className='SchemaForm-error'>{error}</div> }
        </div>
        <footer className='SchemaForm-actions'>
          <button type='button' className='Button Button--ghost' onClick={() => setOpen(false)}>
            { result !== undefined ? 'Close' : 'Cancel' }
          </button>
          {
            result === undefined &&
              <button type='submit' className='Button Button--accent' disabled={running}>Run</button>
          }
        </footer>
      </form>
    </Modal>
  )
}
