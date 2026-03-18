const { Client: McpClient } = require('@modelcontextprotocol/sdk/client')

class Client {
  #client

  constructor () {
    this.#client = new McpClient({ name: 'bridge-client', version: '1.0.0' })
  }

  async connect (transport) {
    await this.#client.connect(transport)
  }
}

module.exports = Client
