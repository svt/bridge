import React from 'react'

/**
 * Remove empty values so that optional
 * fields left blank are not sent to the command
 */
export function clean (value) {
  if (value === '' || value === null) return undefined
  if (Array.isArray(value)) return value
  if (typeof value === 'object' && value !== undefined) {
    const out = {}
    for (const [key, child] of Object.entries(value)) {
      const cleaned = clean(child)
      if (cleaned !== undefined) out[key] = cleaned
    }
    return out
  }
  return value
}

/**
 * Get the names of required properties
 * that are missing from a value
 * @returns { string[] }
 */
export function getMissing (schema = {}, value, path = '') {
  if (schema.type !== 'object' || !schema.properties) return []

  const missing = []
  for (const key of schema.required || []) {
    if (value?.[key] === undefined) missing.push(`${path}${key}`)
  }
  for (const [key, child] of Object.entries(schema.properties)) {
    if (value?.[key] === undefined) continue
    missing.push(...getMissing(child, value[key], `${path}${key}.`))
  }
  return missing
}

function JsonField ({ value, onChange }) {
  const [text, setText] = React.useState(value === undefined ? '' : JSON.stringify(value, null, 2))
  const [invalid, setInvalid] = React.useState(false)

  function handleChange (e) {
    const next = e.target.value
    setText(next)

    if (next.trim() === '') {
      setInvalid(false)
      onChange(undefined)
      return
    }
    try {
      onChange(JSON.parse(next))
      setInvalid(false)
    } catch {
      setInvalid(true)
      onChange(undefined)
    }
  }

  return (
    <>
      <textarea className='SchemaForm-input' rows={4} value={text} onChange={handleChange} />
      { invalid && <div className='SchemaForm-hint'>Invalid JSON</div> }
    </>
  )
}

function FileTextField ({ value, onChange }) {
  const fileRef = React.useRef()

  async function handleFile (e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (file) {
      onChange(await file.text())
    }
  }

  return (
    <>
      <textarea className='SchemaForm-input' rows={6} value={value ?? ''} onChange={e => onChange(e.target.value)} />
      <input ref={fileRef} type='file' hidden onChange={handleFile} />
      <button type='button' className='Button Button--small' onClick={() => fileRef.current.click()}>
        Load from file
      </button>
    </>
  )
}

function Input ({ schema, value, onChange }) {
  if (Array.isArray(schema.enum)) {
    return (
      <select className='SchemaForm-input' value={value ?? ''} onChange={e => onChange(e.target.value === '' ? undefined : schema.enum[e.target.selectedIndex - 1])}>
        <option value='' />
        { schema.enum.map(option => <option key={String(option)} value={String(option)}>{String(option)}</option>) }
      </select>
    )
  }

  switch (schema.type) {
    case 'boolean':
      return <input type='checkbox' checked={value === true} onChange={e => onChange(e.target.checked)} />
    case 'number':
    case 'integer':
      return (
        <input
          type='number'
          className='SchemaForm-input'
          step={schema.type === 'integer' ? 1 : 'any'}
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        />
      )
    case 'string':
      /*
      A media type signals that the value is
      file contents rather than a short string
      */
      if (schema.contentMediaType) {
        return <FileTextField value={value} onChange={onChange} />
      }
      return <input type='text' className='SchemaForm-input' value={value ?? ''} onChange={e => onChange(e.target.value)} />
    case 'object':
      if (schema.properties) {
        return <ObjectFields schema={schema} value={value} onChange={onChange} />
      }
      return <JsonField value={value} onChange={onChange} />
    default:
      return <JsonField value={value} onChange={onChange} />
  }
}

function ObjectFields ({ schema, value = {}, onChange }) {
  return (
    <div className='SchemaForm-group'>
      {
        Object.entries(schema.properties).map(([key, child]) => (
          <Field
            key={key}
            label={key}
            schema={child}
            required={(schema.required || []).includes(key)}
            value={value?.[key]}
            onChange={next => onChange({ ...value, [key]: next })}
          />
        ))
      }
    </div>
  )
}

export function Field ({ label, schema = {}, value, required, onChange }) {
  return (
    <label className='SchemaForm-field'>
      <span className='SchemaForm-label'>
        { schema.title || label }{ required ? ' *' : '' }
      </span>
      { schema.description && <span className='SchemaForm-hint'>{schema.description}</span> }
      <Input schema={schema} value={value} onChange={onChange} />
    </label>
  )
}
