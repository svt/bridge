import React from 'react'
import './style.css'

export function SettingsDisclaimer () {
  return (
    <div className='SettingsDisclaimer'>
      <h3>Disclaimer</h3>
      By configuring and using AI models or third-party MCP services within this application, you acknowledge and agree to the following:
      <div className='SettingsDisclaimer-section'>
        <h3>Data Access:</h3>Connected models and services may receive access to the content of projects, workspaces and files you open or process through the program.
      </div>
      <div className='SettingsDisclaimer-section'>
        <h3>Data transmission:</h3>Information within these files may be transmitted to servers operated by third-party providers (e.g., Anthropic, OpenAI, or other MCP host providers).
      </div>
      <div className='SettingsDisclaimer-section'>
        <h3>Provider policies:</h3>The handling of your data is subject to the privacy policies and terms of service of each configured provider. We do not control how these third parties store or use your information.
      </div>
      <div className='SettingsDisclaimer-section'>
        Please ensure you only connect trusted services and avoid opening documents containing sensitive or proprietary information if you do not wish it to be shared with these providers.
      </div>
    </div>
  )
}
