/**
 * Background Recording Service
 * Attempts to continue recording when screen locks (experimental)
 * 
 * ⚠️ LIMITATIONS:
 * - iOS Safari: Will NOT work reliably - MediaRecorder stops when screen locks
 * - Android Chrome: May work with proper PWA installation
 * - Desktop: Should work fine
 * 
 * This is an experimental workaround. For reliable background recording on iOS,
 * you need a native iOS app using AVFoundation.
 */

export class BackgroundRecordingService {
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private audioWorkletNode: AudioWorkletNode | null = null
  private recordingActive = false
  private chunks: Float32Array[] = []
  private sampleRate = 44100

  /**
   * Initialize Web Audio API recording (experimental)
   * This uses AudioWorklet which may work better than MediaRecorder in some cases
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if AudioWorklet is supported
      if (!window.AudioContext && !(window as any).webkitAudioContext) {
        console.warn('AudioContext not supported')
        return false
      }

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioContext = new AudioContextClass({ sampleRate: this.sampleRate })

      // Check if AudioWorklet is supported
      if (!this.audioContext.audioWorklet) {
        console.warn('AudioWorklet not supported - falling back to MediaRecorder')
        return false
      }

      // Load AudioWorklet processor
      try {
        await this.audioContext.audioWorklet.addModule('/audio-processor.js')
      } catch (error) {
        console.warn('Failed to load AudioWorklet processor:', error)
        // Create inline processor as fallback
        await this.createInlineProcessor()
      }

      return true
    } catch (error) {
      console.error('Failed to initialize background recording:', error)
      return false
    }
  }

  /**
   * Create inline AudioWorklet processor (fallback)
   */
  private async createInlineProcessor(): Promise<void> {
    // This would need to be implemented with a Blob URL
    // For now, we'll use MediaRecorder as fallback
    console.log('Using MediaRecorder fallback')
  }

  /**
   * Start recording using Web Audio API
   * This may continue longer in background than MediaRecorder
   */
  async startRecording(): Promise<MediaStream | null> {
    try {
      if (!this.audioContext) {
        const initialized = await this.initialize()
        if (!initialized) {
          return null
        }
      }

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      if (!this.audioContext || !this.audioContext.audioWorklet) {
        // Fallback to MediaRecorder
        return this.mediaStream
      }

      // Create source from media stream
      const source = this.audioContext.createMediaStreamSource(this.mediaStream)
      
      // Create AudioWorklet node
      this.audioWorkletNode = new AudioWorkletNode(
        this.audioContext,
        'audio-processor'
      )

      // Handle audio data
      this.audioWorkletNode.port.onmessage = (event) => {
        if (event.data.type === 'audioData') {
          this.chunks.push(event.data.data)
        }
      }

      // Connect source to worklet
      source.connect(this.audioWorkletNode)
      
      this.recordingActive = true
      return this.mediaStream
    } catch (error) {
      console.error('Failed to start background recording:', error)
      return null
    }
  }

  /**
   * Stop recording and return audio blob
   */
  async stopRecording(): Promise<Blob | null> {
    try {
      this.recordingActive = false

      if (this.audioWorkletNode) {
        this.audioWorkletNode.disconnect()
        this.audioWorkletNode = null
      }

      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop())
        this.mediaStream = null
      }

      if (this.audioContext) {
        await this.audioContext.close()
        this.audioContext = null
      }

      // Convert Float32Array chunks to WAV
      if (this.chunks.length > 0) {
        return this.convertToWav(this.chunks)
      }

      return null
    } catch (error) {
      console.error('Failed to stop background recording:', error)
      return null
    }
  }

  /**
   * Convert Float32Array chunks to WAV Blob
   */
  private convertToWav(chunks: Float32Array[]): Blob {
    // Combine all chunks
    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const combined = new Float32Array(totalLength)
    let offset = 0
    for (const chunk of chunks) {
      combined.set(chunk, offset)
      offset += chunk.length
    }

    // Convert to 16-bit PCM
    const pcm16 = new Int16Array(combined.length)
    for (let i = 0; i < combined.length; i++) {
      const s = Math.max(-1, Math.min(1, combined[i]))
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF
    }

    // Create WAV header
    const wavHeader = this.createWavHeader(pcm16.length, this.sampleRate)
    const wav = new Blob([wavHeader, pcm16], { type: 'audio/wav' })

    return wav
  }

  /**
   * Create WAV file header
   */
  private createWavHeader(dataLength: number, sampleRate: number): ArrayBuffer {
    const header = new ArrayBuffer(44)
    const view = new DataView(header)

    // RIFF header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataLength * 2, true) // File size - 8
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Subchunk1Size
    view.setUint16(20, 1, true) // AudioFormat (PCM)
    view.setUint16(22, 1, true) // NumChannels
    view.setUint32(24, sampleRate, true) // SampleRate
    view.setUint32(28, sampleRate * 2, true) // ByteRate
    view.setUint16(32, 2, true) // BlockAlign
    view.setUint16(34, 16, true) // BitsPerSample
    writeString(36, 'data')
    view.setUint32(40, dataLength * 2, true) // Subchunk2Size

    return header
  }

  /**
   * Check if background recording is supported
   */
  static isSupported(): boolean {
    // iOS Safari: Not supported
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      return false
    }

    // Check for AudioWorklet support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    if (!AudioContextClass) {
      return false
    }

    try {
      const context = new AudioContextClass()
      return !!context.audioWorklet
    } catch {
      return false
    }
  }
}

