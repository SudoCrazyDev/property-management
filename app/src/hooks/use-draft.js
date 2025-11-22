import { useEffect, useCallback, useRef } from "react"
import { saveDraft, loadDraft, deleteDraft } from "@/lib/draft-storage"

/**
 * Hook for managing draft job data with auto-save
 * @param {string} jobId - The job ID
 * @param {object} jobData - The current job data
 * @param {number} autoSaveInterval - Auto-save interval in milliseconds (default: 30000 = 30 seconds)
 */
export function useDraft(jobId, jobData, autoSaveInterval = 30000) {
  const autoSaveTimerRef = useRef(null)
  const lastSavedRef = useRef(null)

  // Load draft on mount
  useEffect(() => {
    if (jobId) {
      const draft = loadDraft(jobId)
      if (draft) {
        // Return draft data to be merged with current data
        // This will be handled by the component
      }
    }
  }, [jobId])

  // Auto-save draft periodically
  useEffect(() => {
    if (!jobId || !jobData) return

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current)
    }

    // Set up auto-save timer
    autoSaveTimerRef.current = setInterval(() => {
      const currentData = JSON.stringify(jobData)
      const lastSaved = lastSavedRef.current

      // Only save if data has changed
      if (currentData !== lastSaved) {
        saveDraft(jobId, jobData)
        lastSavedRef.current = currentData
        console.log("Auto-saved draft for job:", jobId)
      }
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [jobId, jobData, autoSaveInterval])

  // Manual save function
  const saveDraftManually = useCallback(() => {
    if (jobId && jobData) {
      saveDraft(jobId, jobData)
      lastSavedRef.current = JSON.stringify(jobData)
      return true
    }
    return false
  }, [jobId, jobData])

  // Load draft function
  const loadDraftData = useCallback(() => {
    if (jobId) {
      return loadDraft(jobId)
    }
    return null
  }, [jobId])

  // Delete draft function
  const removeDraft = useCallback(() => {
    if (jobId) {
      deleteDraft(jobId)
      lastSavedRef.current = null
    }
  }, [jobId])

  return {
    saveDraft: saveDraftManually,
    loadDraft: loadDraftData,
    deleteDraft: removeDraft,
  }
}

