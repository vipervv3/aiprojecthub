/**
 * Recording Backup Service
 * Handles local backup of recording chunks using IndexedDB for offline persistence
 * and recovery from crashes, network issues, battery death, etc.
 */

interface RecordingChunk {
  sessionId: string
  chunkIndex: number
  blob: Blob
  timestamp: number
  uploaded: boolean
}

interface RecordingSession {
  sessionId: string
  userId: string
  projectId: string
  startTime: number
  chunks: RecordingChunk[]
  uploadedChunks: string[] // Paths of uploaded chunks
  status: 'recording' | 'paused' | 'stopped' | 'uploading'
}

const DB_NAME = 'recording-backup-db'
const DB_VERSION = 1
const CHUNKS_STORE = 'chunks'
const SESSIONS_STORE = 'sessions'

export class RecordingBackupService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  /**
   * Initialize IndexedDB database
   */
  async init(): Promise<void> {
    if (this.db) return
    
    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        console.log('✅ IndexedDB initialized for recording backup')
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create chunks store
        if (!db.objectStoreNames.contains(CHUNKS_STORE)) {
          const chunksStore = db.createObjectStore(CHUNKS_STORE, { keyPath: ['sessionId', 'chunkIndex'] })
          chunksStore.createIndex('sessionId', 'sessionId', { unique: false })
          chunksStore.createIndex('uploaded', 'uploaded', { unique: false })
        }

        // Create sessions store
        if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
          const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'sessionId' })
          sessionsStore.createIndex('status', 'status', { unique: false })
        }
      }
    })

    return this.initPromise
  }

  /**
   * Save a recording chunk to IndexedDB
   */
  async saveChunk(chunk: RecordingChunk): Promise<void> {
    await this.init()

    if (!this.db) {
      throw new Error('IndexedDB not initialized')
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readwrite')
      const store = transaction.objectStore(CHUNKS_STORE)
      const request = store.put(chunk)

      request.onsuccess = () => {
        console.log(`✅ Chunk ${chunk.chunkIndex} saved to IndexedDB for session ${chunk.sessionId}`)
        resolve()
      }

      request.onerror = () => {
        console.error('Failed to save chunk to IndexedDB:', request.error)
        reject(request.error)
      }
    })
  }

  /**
   * Get all chunks for a session
   */
  async getChunks(sessionId: string): Promise<RecordingChunk[]> {
    await this.init()

    if (!this.db) {
      return []
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readonly')
      const store = transaction.objectStore(CHUNKS_STORE)
      const index = store.index('sessionId')
      const request = index.getAll(sessionId)

      request.onsuccess = () => {
        // Sort by chunk index
        const chunks = request.result.sort((a, b) => a.chunkIndex - b.chunkIndex)
        resolve(chunks)
      }

      request.onerror = () => {
        console.error('Failed to get chunks from IndexedDB:', request.error)
        resolve([]) // Return empty array on error, don't fail
      }
    })
  }

  /**
   * Mark a chunk as uploaded
   */
  async markChunkUploaded(sessionId: string, chunkIndex: number): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CHUNKS_STORE], 'readwrite')
      const store = transaction.objectStore(CHUNKS_STORE)
      const getRequest = store.get([sessionId, chunkIndex])

      getRequest.onsuccess = () => {
        const chunk = getRequest.result
        if (chunk) {
          chunk.uploaded = true
          const putRequest = store.put(chunk)
          putRequest.onsuccess = () => resolve()
          putRequest.onerror = () => resolve() // Don't fail on error
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => resolve()
    })
  }

  /**
   * Save recording session metadata
   */
  async saveSession(session: RecordingSession): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite')
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.put(session)

      request.onsuccess = () => resolve()
      request.onerror = () => {
        console.error('Failed to save session to IndexedDB:', request.error)
        resolve() // Don't fail on error
      }
    })
  }

  /**
   * Get recording session metadata
   */
  async getSession(sessionId: string): Promise<RecordingSession | null> {
    await this.init()

    if (!this.db) {
      return null
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly')
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.get(sessionId)

      request.onsuccess = () => {
        resolve(request.result || null)
      }

      request.onerror = () => {
        resolve(null)
      }
    })
  }

  /**
   * Get all incomplete recording sessions (for recovery)
   */
  async getIncompleteSessions(): Promise<RecordingSession[]> {
    await this.init()

    if (!this.db) {
      return []
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readonly')
      const store = transaction.objectStore(SESSIONS_STORE)
      const index = store.index('status')
      const request = index.getAll('recording')

      request.onsuccess = () => {
        resolve(request.result || [])
      }

      request.onerror = () => {
        resolve([])
      }
    })
  }

  /**
   * Delete a session and all its chunks
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([CHUNKS_STORE, SESSIONS_STORE], 'readwrite')
      
      // Delete all chunks
      const chunksStore = transaction.objectStore(CHUNKS_STORE)
      const index = chunksStore.index('sessionId')
      const chunksRequest = index.openCursor(IDBKeyRange.only(sessionId))

      chunksRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        }
      }

      // Delete session
      const sessionsStore = transaction.objectStore(SESSIONS_STORE)
      sessionsStore.delete(sessionId)

      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
    })
  }

  /**
   * Clear all old sessions (older than 7 days)
   */
  async cleanupOldSessions(): Promise<void> {
    await this.init()

    if (!this.db) {
      return
    }

    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000)

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([SESSIONS_STORE], 'readwrite')
      const store = transaction.objectStore(SESSIONS_STORE)
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result
        if (cursor) {
          const session = cursor.value
          if (session.startTime < sevenDaysAgo) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }

      request.onerror = () => resolve()
    })
  }
}

// Export singleton instance
export const recordingBackupService = new RecordingBackupService()

