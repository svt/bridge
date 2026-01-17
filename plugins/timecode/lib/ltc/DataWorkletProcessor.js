class DataWorkletProcessor extends AudioWorkletProcessor {
  constructor (opts) {
    super()
    this._apv = opts?.processorOptions?.apv
    this._buffer = new Float32Array(this._apv)
    this._index = 0
  }

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
