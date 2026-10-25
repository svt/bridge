import React from 'react'
import * as api from '../../../api'

import { OPEN_EVENT } from '../../CommandModal'

const CACHE_TTL_MS = 2000

let cache
let cachedAt = 0

async function listCommands () {
  if (cache && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cache
  }
  const bridge = await api.load()
  cache = (await bridge.commands.executeCommand('commands.list')) || []
  cachedAt = Date.now()
  return cache
}

async function run (command) {
  const bridge = await api.load()

  /*
  Commands without arguments run directly,
  all others are completed in a form
  */
  if (!command.args?.prefixItems?.length) {
    try {
      const res = await bridge.commands.executeCommand(command.id)
      bridge.messages.createSuccessMessage({
        text: `${command.id}: ${res === undefined ? 'Done' : JSON.stringify(res)}`
      })
    } catch (err) {
      bridge.messages.createWarningMessage({ text: `${command.id}: ${err.message}` })
    }
    return
  }

  bridge.events.emitLocally(OPEN_EVENT, command)
}

function CommandRow ({ command }) {
  return (
    <div className='Palette-row--commandRow' onClick={() => run(command)}>
      <div className='Palette-row--commandRow-label'>{command.label}</div>
      <div className='Palette-row--commandRow-id'>{command.id}</div>
    </div>
  )
}

async function getCommands (query) {
  const normalizedQuery = query.trim().toLowerCase()

  return (await listCommands())
    .filter(command =>
      command.id.toLowerCase().includes(normalizedQuery) ||
      command.label.toLowerCase().includes(normalizedQuery) ||
      command.description.toLowerCase().includes(normalizedQuery)
    )
    .map(command => <CommandRow key={command.id} command={command} />)
}

/**
 * Only queried when the input starts with the prefix
 * @type {{
 *  label: String,
 *  prefix: String,
 *  get: () => React.Component[]
 * }}
 */
export default {
  label: 'Commands',
  prefix: '>',
  get: ({ query }) => getCommands(query)
}
