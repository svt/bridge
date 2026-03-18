const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js')

class Server {
  #server

  get mcpServer () {
    return this.#server
  }

  constructor () {
    this.#server = new McpServer({ name: 'bridge-server', version: '1.0.0' })
  }

  async connect (transport) {
    await this.#server.connect(transport)
  }
}

module.exports = Server
