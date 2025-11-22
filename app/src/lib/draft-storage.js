/**
 * Draft Storage Utility
 * Handles saving and loading draft job data from localStorage
 * Uses IndexedDB for file storage (for larger files)
 */

const DRAFT_STORAGE_KEY = "inspector_drafts"
const DRAFT_PREFIX = "inspector_draft_"

/**
 * Save draft job data to localStorage
 * @param {string} jobId - The job ID
 * @param {object} jobData - The job data including attributes
 */
export function saveDraft(jobId, jobData) {
  try {
    const draftKey = `${DRAFT_PREFIX}${jobId}`
    const draftData = {
      jobId,
      data: jobData,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem(draftKey, JSON.stringify(draftData))
    
    // Also update the list of drafts
    const drafts = getDraftList()
    if (!drafts.includes(jobId)) {
      drafts.push(jobId)
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(drafts))
    }
  } catch (error) {
    console.error("Error saving draft:", error)
    // Handle quota exceeded error
    if (error.name === "QuotaExceededError") {
      // Try to clean up old drafts
      cleanupOldDrafts()
      // Retry saving
      try {
        const draftKey = `${DRAFT_PREFIX}${jobId}`
        const draftData = {
          jobId,
          data: jobData,
          timestamp: new Date().toISOString(),
        }
        localStorage.setItem(draftKey, JSON.stringify(draftData))
      } catch (retryError) {
        console.error("Failed to save draft after cleanup:", retryError)
      }
    }
  }
}

/**
 * Load draft job data from localStorage
 * @param {string} jobId - The job ID
 * @returns {object|null} The draft data or null if not found
 */
export function loadDraft(jobId) {
  try {
    const draftKey = `${DRAFT_PREFIX}${jobId}`
    const draftJson = localStorage.getItem(draftKey)
    if (!draftJson) return null
    
    const draftData = JSON.parse(draftJson)
    return draftData.data
  } catch (error) {
    console.error("Error loading draft:", error)
    return null
  }
}

/**
 * Delete draft for a specific job
 * @param {string} jobId - The job ID
 */
export function deleteDraft(jobId) {
  try {
    const draftKey = `${DRAFT_PREFIX}${jobId}`
    localStorage.removeItem(draftKey)
    
    // Remove from drafts list
    const drafts = getDraftList()
    const updatedDrafts = drafts.filter(id => id !== jobId)
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(updatedDrafts))
  } catch (error) {
    console.error("Error deleting draft:", error)
  }
}

/**
 * Get list of all draft job IDs
 * @returns {string[]} Array of job IDs
 */
export function getDraftList() {
  try {
    const draftsJson = localStorage.getItem(DRAFT_STORAGE_KEY)
    return draftsJson ? JSON.parse(draftsJson) : []
  } catch (error) {
    console.error("Error getting draft list:", error)
    return []
  }
}

/**
 * Clean up old drafts (older than 7 days)
 */
function cleanupOldDrafts() {
  try {
    const drafts = getDraftList()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    drafts.forEach(jobId => {
      const draftKey = `${DRAFT_PREFIX}${jobId}`
      const draftJson = localStorage.getItem(draftKey)
      if (draftJson) {
        try {
          const draftData = JSON.parse(draftJson)
          const draftTime = new Date(draftData.timestamp).getTime()
          if (draftTime < sevenDaysAgo) {
            localStorage.removeItem(draftKey)
          }
        } catch (e) {
          // Invalid draft, remove it
          localStorage.removeItem(draftKey)
        }
      }
    })
    
    // Update drafts list
    const remainingDrafts = drafts.filter(jobId => {
      const draftKey = `${DRAFT_PREFIX}${jobId}`
      return localStorage.getItem(draftKey) !== null
    })
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(remainingDrafts))
  } catch (error) {
    console.error("Error cleaning up drafts:", error)
  }
}

/**
 * Initialize IndexedDB database for file storage
 * @returns {Promise<IDBDatabase>} The database instance
 */
function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("InspectorFilesDB", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains("files")) {
        const objectStore = db.createObjectStore("files", { keyPath: "id" })
        objectStore.createIndex("jobId", "jobId", { unique: false })
        objectStore.createIndex("attributeId", "attributeId", { unique: false })
        objectStore.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

/**
 * Store file in IndexedDB for offline access
 * @param {string} jobId - The job ID
 * @param {string} attributeId - The attribute ID
 * @param {File} file - The file to store
 * @returns {Promise<string>} A unique file ID
 */
export async function storeFileOffline(jobId, attributeId, file) {
  try {
    const db = await initDB()
    const fileId = `${jobId}_${attributeId}_${Date.now()}_${Math.random().toString(36).substring(7)}`
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files"], "readwrite")
      const objectStore = transaction.objectStore("files")
      
      const fileData = {
        id: fileId,
        jobId,
        attributeId,
        name: file.name,
        type: file.type,
        size: file.size,
        file: file, // Store File object directly in IndexedDB
        timestamp: new Date().toISOString(),
      }
      
      const request = objectStore.add(fileData)
      
      request.onsuccess = () => resolve(fileId)
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error storing file in IndexedDB:", error)
    throw error
  }
}

/**
 * Retrieve file from offline storage
 * @param {string} fileId - The file ID
 * @returns {Promise<File>} The file
 */
export async function retrieveFileOffline(fileId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files"], "readonly")
      const objectStore = transaction.objectStore("files")
      const request = objectStore.get(fileId)
      
      request.onsuccess = () => {
        const fileData = request.result
        if (!fileData) {
          reject(new Error("File not found"))
          return
        }
        resolve(fileData.file)
      }
      
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error retrieving file from IndexedDB:", error)
    throw error
  }
}

/**
 * Delete file from offline storage
 * @param {string} fileId - The file ID
 */
export async function deleteFileOffline(fileId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files"], "readwrite")
      const objectStore = transaction.objectStore("files")
      const request = objectStore.delete(fileId)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error deleting file from IndexedDB:", error)
    throw error
  }
}

/**
 * Get all files for a specific job and attribute
 * @param {string} jobId - The job ID
 * @param {string} attributeId - The attribute ID
 * @returns {Promise<File[]>} Array of files
 */
export async function getFilesForAttribute(jobId, attributeId) {
  try {
    const db = await initDB()
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files"], "readonly")
      const objectStore = transaction.objectStore("files")
      const index = objectStore.index("jobId")
      const request = index.getAll(jobId)
      
      request.onsuccess = () => {
        const allFiles = request.result
        const filteredFiles = allFiles
          .filter(fileData => fileData.attributeId === attributeId)
          .map(fileData => fileData.file)
        resolve(filteredFiles)
      }
      
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error getting files from IndexedDB:", error)
    throw error
  }
}

/**
 * Clean up old files (older than 7 days)
 */
export async function cleanupOldFiles() {
  try {
    const db = await initDB()
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(["files"], "readwrite")
      const objectStore = transaction.objectStore("files")
      const index = objectStore.index("timestamp")
      const request = index.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          const fileData = cursor.value
          const fileTime = new Date(fileData.timestamp).getTime()
          if (fileTime < sevenDaysAgo) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          resolve()
        }
      }
      
      request.onerror = () => reject(request.error)
    })
  } catch (error) {
    console.error("Error cleaning up old files:", error)
    throw error
  }
}

