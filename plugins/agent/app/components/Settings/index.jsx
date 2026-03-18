import React from 'react'
import bridge from 'bridge'
import './style.css'

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI' },
  { id: 'anthropic', label: 'Anthropic' },
  { id: 'custom', label: 'Custom (OpenAI-compatible)' }
]

export function Settings () {
  const [settings, setSettings] = React.useState({
    provider: PROVIDERS[0].id,
    model: '',
    apiKey: '',
    baseUrl: '',
    hasExistingKey: false
  })
  const [models, setModels] = React.useState([])
  const [isLoadingModels, setIsLoadingModels] = React.useState(false)

  React.useEffect(() => {
    async function load () {
      const res = await bridge.commands.executeCommand('agent.getSettings')
      setSettings(current => ({
        ...current,
        provider: res?.provider || current.provider,
        model: res?.model || current.model,
        apiKey: res?.apiKey || current.apiKey,
        baseUrl: res?.baseUrl || current.baseUrl,
        hasExistingKey: !!res?.hasKey
      }))
    }
    load()
  }, [])

  React.useEffect(() => {
    const isCustom = settings.provider === 'custom'
    if ((isCustom && settings.baseUrl) || (!isCustom && settings.hasExistingKey)) {
      fetchModels()
    } else {
      setModels([])
    }
  }, [settings.provider, settings.hasExistingKey])

  async function fetchModels () {
    setIsLoadingModels(true)
    try {
      const res = await bridge.commands.executeCommand('agent.listModels')
      const fetched = res?.models || []
      setModels(fetched)
      if (fetched.length > 0) {
        setSettings(current => ({
          ...current,
          model: fetched.some(m => m.id === current.model) ? current.model : fetched[0].id
        }))
      }
    } catch (_) {
      setModels([])
    } finally {
      setIsLoadingModels(false)
    }
  }

  async function handleValueChange (updates) {
    const updated = { ...settings, ...updates }
    setSettings(updated)

    const payload = {
      provider: updated.provider,
      model: updated.model,
      apiKey: updated.apiKey,
      baseUrl: updated.baseUrl
    }

    try {
      await bridge.commands.executeCommand('agent.setSettings', payload)
      if (payload.apiKey) {
        setSettings(current => ({ ...current, hasExistingKey: true }))
      }
    } catch (_) {}
  }

  function handleProviderChange (e) {
    setModels([])
    handleValueChange({ provider: e.target.value, model: '', apiKey: '', baseUrl: '', hasExistingKey: false })
  }

  function handleModelChange (e) {
    handleValueChange({ model: e.target.value })
  }

  async function handleApiKeyBlur () {
    if (!settings.apiKey && !settings.hasExistingKey) return
    await handleValueChange({ apiKey: settings.apiKey })
    if (!settings.apiKey) {
      setSettings(current => ({ ...current, hasExistingKey: false }))
    }
    fetchModels()
  }

  async function handleBaseUrlBlur () {
    await handleValueChange({ baseUrl: settings.baseUrl })
    fetchModels()
  }

  const currentProvider = PROVIDERS.find(p => p.id === settings.provider)
  const isCustom = settings.provider === 'custom'

  return (
    <div className='Settings'>
      <div className='Settings-section'>
        <h3>Provider</h3>
        <select
          value={settings.provider}
          onChange={handleProviderChange}
        >
          {PROVIDERS.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </div>

      {
      /*
      Add an input for the
      url if custom is selected
      */
      isCustom && (
        <div className='Settings-section'>
          <h3>Endpoint URL</h3>
          <div className='Settings-description'>
            Base URL of an OpenAI-compatible API (e.g. http://localhost:11434/v1)
          </div>
          <input
            type='text'
            className='Input'
            value={settings.baseUrl}
            onChange={e => setSettings(s => ({ ...s, baseUrl: e.target.value }))}
            onBlur={handleBaseUrlBlur}
            placeholder='http://localhost:11434/v1'
          />
        </div>
      )}

      <div className='Settings-section'>
        <h3>
          {
            isCustom
            ? 'API Key (optional)'
            : 'API Key'
          }
        </h3>
        <div className='Settings-description'>
          {
            isCustom
              ? 'Only needed if your endpoint requires authentication'
              : `Enter your ${currentProvider?.label} API key`
          }
        </div>
        <input
          type='text'
          className='Input'
          placeholder='Api key'
          value={settings.apiKey}
          onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
          onBlur={handleApiKeyBlur}
        />
      </div>

      <div className='Settings-section'>
        <h3>Model</h3>
        {
          isLoadingModels
            ? (
              <div className='Settings-loader'>
                <span className='Loader' />
              </div>
            )
            : models.length > 0
              ? (
                <select
                  value={settings.model}
                  onChange={handleModelChange}
                >
                  {models.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              )
              : (
                <>
                  {
                  isCustom
                    ? (settings.baseUrl ? 'No models found' : 'Enter an endpoint URL to load available models')
                    : (settings.hasExistingKey ? 'No models found' : 'Enter an API key to load available models')
                  }
                </>
              )
        }
      </div>
    </div>
  )
}
