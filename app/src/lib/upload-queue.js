/**
 * Upload Queue Manager
 * Handles queuing file uploads with retry logic and progress tracking
 * Supports online/offline status - pauses when offline, resumes when online
 */

import { uploadFiles } from "./file-upload"

const MAX_RETRIES = 3
const RETRY_DELAY = 2000 // 2 seconds

class UploadQueue {
  constructor() {
    this.queue = []
    this.uploading = false
    this.listeners = new Map()
    this.isOnline = typeof navigator !== "undefined" ? navigator.onLine : true
    this.setupOnlineListeners()
  }

  /**
   * Setup online/offline event listeners
   */
  setupOnlineListeners() {
    if (typeof window === "undefined") return

    const handleOnline = () => {
      this.isOnline = true
      console.log("Connection restored - resuming upload queue")
      this.processQueue() // Resume processing when back online
    }

    const handleOffline = () => {
      this.isOnline = false
      console.log("Connection lost - pausing upload queue")
      // Don't clear the queue, just pause processing
    }

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)
  }

  /**
   * Add file to upload queue
   * @param {object} fileItem - File item with metadata
   * @param {Function} onProgress - Progress callback
   * @param {Function} onComplete - Completion callback
   * @param {Function} onError - Error callback
   */
  enqueue(fileItem, onProgress, onComplete, onError) {
    const queueItem = {
      id: fileItem.id || `${Date.now()}_${Math.random()}`,
      file: fileItem.file,
      fileId: fileItem.fileId, // Offline file ID
      jobId: fileItem.jobId,
      attributeId: fileItem.attributeId,
      folderPrefix: fileItem.folderPrefix || "", // Folder prefix for upload path
      retries: 0,
      onProgress,
      onComplete,
      onError,
      status: "pending", // pending, uploading, completed, failed
    }

    this.queue.push(queueItem)
    this.processQueue()
    
    return queueItem.id
  }

  /**
   * Process the upload queue
   * Only processes when online
   */
  async processQueue() {
    // Don't process if offline
    if (!this.isOnline) {
      console.log("Queue processing paused - offline")
      return
    }

    if (this.uploading || this.queue.length === 0) return

    this.uploading = true

    while (this.queue.length > 0) {
      // Check online status before each upload
      if (!this.isOnline) {
        console.log("Connection lost during upload - pausing queue")
        this.uploading = false
        return
      }

      const item = this.queue.find(i => i.status === "pending")
      if (!item) break

      item.status = "uploading"
      this.notifyListeners(item.id, "uploading", 0)

      try {
        // If file has offlineId, retrieve it from IndexedDB
        let fileToUpload = item.file
        if (item.fileId) {
          const { retrieveFileOffline } = await import("./draft-storage")
          const retrievedFile = await retrieveFileOffline(item.fileId)
          if (retrievedFile) {
            fileToUpload = retrievedFile
          } else {
            throw new Error(`File not found in offline storage: ${item.fileId}`)
          }
        }
        
        // Upload the file with the specified folder prefix
        const folderPrefix = item.folderPrefix || "inspector-checklists" // Default to inspector-checklists for backward compatibility
        const paths = await uploadFiles([fileToUpload], folderPrefix)
        
        if (paths && paths.length > 0) {
          item.status = "completed"
          this.notifyListeners(item.id, "completed", 100)
          if (item.onComplete) {
            item.onComplete(paths[0])
          }
          
          // Delete file from IndexedDB after successful upload
          if (item.fileId) {
            try {
              const { deleteFileOffline } = await import("./draft-storage")
              await deleteFileOffline(item.fileId)
            } catch (error) {
              console.error("Error deleting file from IndexedDB after upload:", error)
            }
          }
          
          // Remove from queue
          this.queue = this.queue.filter(i => i.id !== item.id)
        } else {
          throw new Error("Upload returned no paths")
        }
      } catch (error) {
        console.error("Upload error:", error)
        item.retries++

        if (item.retries < MAX_RETRIES) {
          // Retry after delay
          item.status = "pending"
          this.notifyListeners(item.id, "retrying", 0)
          
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * item.retries))
        } else {
          // Max retries reached
          item.status = "failed"
          this.notifyListeners(item.id, "failed", 0)
          if (item.onError) {
            item.onError(error)
          }
          
          // Keep in queue for manual retry
        }
      }
    }

    this.uploading = false
  }

  /**
   * Retry a failed upload
   * @param {string} itemId - The queue item ID
   */
  retry(itemId) {
    const item = this.queue.find(i => i.id === itemId)
    if (item && item.status === "failed") {
      item.status = "pending"
      item.retries = 0
      this.processQueue()
    }
  }

  /**
   * Remove item from queue
   * @param {string} itemId - The queue item ID
   */
  remove(itemId) {
    this.queue = this.queue.filter(i => i.id !== itemId)
    this.listeners.delete(itemId)
  }

  /**
   * Get queue status
   */
  getStatus() {
    return {
      total: this.queue.length,
      pending: this.queue.filter(i => i.status === "pending").length,
      uploading: this.queue.filter(i => i.status === "uploading").length,
      completed: this.queue.filter(i => i.status === "completed").length,
      failed: this.queue.filter(i => i.status === "failed").length,
    }
  }

  /**
   * Add listener for queue item updates
   * @param {string} itemId - The queue item ID
   * @param {Function} callback - Callback function
   */
  addListener(itemId, callback) {
    this.listeners.set(itemId, callback)
  }

  /**
   * Remove listener
   * @param {string} itemId - The queue item ID
   */
  removeListener(itemId) {
    this.listeners.delete(itemId)
  }

  /**
   * Notify listeners of status change
   */
  notifyListeners(itemId, status, progress) {
    const listener = this.listeners.get(itemId)
    if (listener) {
      listener({ status, progress })
    }
  }

  /**
   * Wait for all pending/uploading items to complete
   * @returns {Promise<void>} Resolves when all items are completed or failed
   */
  async waitForAll() {
    return new Promise((resolve) => {
      const checkComplete = () => {
        const status = this.getStatus()
        if (status.pending === 0 && status.uploading === 0) {
          resolve()
        } else {
          // Check again after a short delay
          setTimeout(checkComplete, 500)
        }
      }
      checkComplete()
    })
  }
}

// Singleton instance
export const uploadQueue = new UploadQueue()

