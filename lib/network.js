const os = require('os')

/**
 * Get the first IPv4
 * address of the server
 * @returns { String }
 */
function getFirstIPv4Address () {
  const nets = os.networkInterfaces()

  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      const familyV4Value = typeof net.family === 'string' ? 'IPv4' : 4
      if (net.family !== familyV4Value || net.internal) {
        continue
      }
      return net.address
    }
  }
}
exports.getFirstIPv4Address = getFirstIPv4Address
