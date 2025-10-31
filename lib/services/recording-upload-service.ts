/**
 * Recording Upload Service
 * Handles chunked audio uploads to Supabase Storage with retry logic
 */

import { supabase } from '../supabase'

const STORAGE_BUCKET = 'meeting-recordings'
const CHUNK_SIZE = 1024 * 1024 // 1MB chunks for uploading
const MAX_RETRIES = 3

export interface UploadProgress {
  progress: number // 0-100
  uploaded: number // bytes
  total: number // bytes
  currentChunk: number
  totalChunks: number
}

export interface ChunkInfo {
  index: number
  size: number
  path: string
  uploaded: boolean
}

export class RecordingUploadService {
  private uploadProgress: Map<string, UploadProgress> = new Map()

  /**
   * Upload a single chunk with retry logic
   */
  private async uploadChunk(
    chunk: Blob,
    path: string,
    retries: number = 0
  ): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, chunk, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error(`Error uploading chunk ${path}:`, error)
      
      if (retries < MAX_RETRIES) {
        console.log(`Retrying chunk ${path} (attempt ${retries + 1}/${MAX_RETRIES})`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (retries + 1)))
        return this.uploadChunk(chunk, path, retries + 1)
      }
      
      return false
    }
  }

  /**
   * Upload audio file in chunks for better reliability
   */
  async uploadRecordingChunked(
    audioBlob: Blob,
    userId: string,
    sessionId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{
    success: boolean
    storagePath?: string
    chunks?: ChunkInfo[]
    error?: string
  }> {
    try {
      const totalSize = audioBlob.size
      const numChunks = Math.ceil(totalSize / CHUNK_SIZE)
      const chunks: ChunkInfo[] = []
      
      // Initialize progress
      const progress: UploadProgress = {
        progress: 0,
        uploaded: 0,
        total: totalSize,
        currentChunk: 0,
        totalChunks: numChunks,
      }

      this.uploadProgress.set(sessionId, progress)

      // Upload each chunk
      for (let i = 0; i < numChunks; i++) {
        const start = i * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, totalSize)
        const chunk = audioBlob.slice(start, end)
        
        const chunkPath = `${userId}/${sessionId}/chunk-${i}.webm`
        
        // Update progress
        progress.currentChunk = i + 1
        onProgress?.(progress)

        // Upload chunk
        const success = await this.uploadChunk(chunk, chunkPath)
        
        if (!success) {
          return {
            success: false,
            error: `Failed to upload chunk ${i} after ${MAX_RETRIES} retries`,
          }
        }

        // Track chunk info
        chunks.push({
          index: i,
          size: chunk.size,
          path: chunkPath,
          uploaded: true,
        })

        // Update progress
        progress.uploaded += chunk.size
        progress.progress = Math.round((progress.uploaded / totalSize) * 100)
        onProgress?.(progress)
      }

      // Upload complete file as well (for easier playback)
      const finalPath = `${userId}/${sessionId}/recording.webm`
      const finalSuccess = await this.uploadChunk(audioBlob, finalPath)

      if (!finalSuccess) {
        console.warn('Failed to upload complete file, but chunks are uploaded')
      }

      return {
        success: true,
        storagePath: finalPath,
        chunks,
      }
    } catch (error) {
      console.error('Error in uploadRecordingChunked:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    } finally {
      this.uploadProgress.delete(sessionId)
    }
  }

  /**
   * Upload in real-time as chunks are recorded
   */
  async uploadChunkLive(
    chunk: Blob,
    userId: string,
    sessionId: string,
    chunkIndex: number
  ): Promise<{
    success: boolean
    path?: string
    error?: string
  }> {
    try {
      const chunkPath = `${userId}/${sessionId}/chunk-${chunkIndex}.webm`
      const success = await this.uploadChunk(chunk, chunkPath)
      
      if (!success) {
        return {
          success: false,
          error: 'Failed to upload chunk',
        }
      }

      return {
        success: true,
        path: chunkPath,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Assemble chunks into final file (server-side operation)
   */
  async assembleChunks(
    userId: string,
    sessionId: string,
    numChunks: number
  ): Promise<{
    success: boolean
    finalPath?: string
    error?: string
  }> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Download all chunks
      const chunkBlobs: Blob[] = []
      for (let i = 0; i < numChunks; i++) {
        const chunkPath = `${userId}/${sessionId}/chunk-${i}.webm`
        
        const { data, error } = await supabase.storage
          .from(STORAGE_BUCKET)
          .download(chunkPath)
        
        if (error || !data) {
          throw new Error(`Failed to download chunk ${i}`)
        }
        
        chunkBlobs.push(data)
      }

      // Combine chunks
      const finalBlob = new Blob(chunkBlobs, { type: 'audio/webm' })
      
      // Upload final file
      const finalPath = `${userId}/${sessionId}/recording.webm`
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(finalPath, finalBlob, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        throw uploadError
      }

      return {
        success: true,
        finalPath,
      }
    } catch (error) {
      console.error('Error assembling chunks:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  /**
   * Get public URL for recording
   */
  async getPublicUrl(path: string): Promise<string | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(path)

      return data?.publicUrl || null
    } catch (error) {
      console.error('Error getting public URL:', error)
      return null
    }
  }

  /**
   * Get signed URL for private recordings (valid for 1 hour)
   */
  async getSignedUrl(path: string, expiresIn: number = 3600): Promise<string | null> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .createSignedUrl(path, expiresIn)

      if (error) {
        throw error
      }

      return data?.signedUrl || null
    } catch (error) {
      console.error('Error getting signed URL:', error)
      return null
    }
  }

  /**
   * Delete recording and all its chunks
   */
  async deleteRecording(userId: string, sessionId: string): Promise<boolean> {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // List all files in session folder
      const { data: files, error: listError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .list(`${userId}/${sessionId}`)

      if (listError) {
        throw listError
      }

      if (!files || files.length === 0) {
        return true // Nothing to delete
      }

      // Delete all files
      const filePaths = files.map(file => `${userId}/${sessionId}/${file.name}`)
      const { error: deleteError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filePaths)

      if (deleteError) {
        throw deleteError
      }

      return true
    } catch (error) {
      console.error('Error deleting recording:', error)
      return false
    }
  }
}

// Export singleton instance
export const recordingUploadService = new RecordingUploadService()

// Export for server-side use
export default RecordingUploadService




