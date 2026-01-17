class DataWorkletProcessor extends AudioWorkletProcessor {
  process (inputs, outputs, parameters) {
    const input = inputs[0]
    if (!input || input.length === 0) {
      return true
    }

    const channelData = input[0]
    this.port.postMessage({
      buffer: channelData.slice()
    })

    return true
  }
}

registerProcessor('DataWorkletProcessor', DataWorkletProcessor)
