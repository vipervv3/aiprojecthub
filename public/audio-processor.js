// AudioWorklet Processor for background recording
// This runs in a separate thread and may continue when main thread is suspended

class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this.bufferSize = 4096
    this.buffer = new Float32Array(this.bufferSize)
    this.bufferIndex = 0
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0]
    
    if (input.length > 0) {
      const inputChannel = input[0]
      
      // Copy input to buffer
      for (let i = 0; i < inputChannel.length; i++) {
        this.buffer[this.bufferIndex++] = inputChannel[i]
        
        // When buffer is full, send it to main thread
        if (this.bufferIndex >= this.bufferSize) {
          this.port.postMessage({
            type: 'audioData',
            data: new Float32Array(this.buffer)
          })
          this.bufferIndex = 0
        }
      }
    }
    
    // Return true to keep processor alive
    return true
  }
}

registerProcessor('audio-processor', AudioProcessor)

