import { useState, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing QA checklists CRUD operations
 */
export function useQAChecklists() {
  const [error, setError] = useState(null)

  // Create or update QA checklist entry
  const upsertQAChecklist = useCallback(async (jobId, locationId, attributeId, statusId, notes) => {
    try {
      setError(null)
      const { data, error: upsertError } = await supabase
        .from("qa_checklists")
        .upsert(
          {
            job_id: jobId,
            location_id: locationId,
            attribute_id: attributeId,
            status_id: statusId || null,
            notes: notes || null,
          },
          {
            onConflict: "job_id,location_id,attribute_id",
          }
        )
        .select()
        .single()

      if (upsertError) throw upsertError

      return { success: true, data }
    } catch (err) {
      console.error("Error upserting QA checklist:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch QA checklists for a job
  const fetchQAChecklists = useCallback(async (jobId) => {
    try {
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("qa_checklists")
        .select(`
          *,
          location:property_locations(id, name),
          attribute:location_attributes(id, name),
          status:qa_statuses(id, name)
        `)
        .eq("job_id", jobId)

      if (fetchError) throw fetchError

      return { success: true, data: data || [] }
    } catch (err) {
      console.error("Error fetching QA checklists:", err)
      setError(err.message)
      return { success: false, error: err.message, data: [] }
    }
  }, [])

  // Delete QA checklist entry
  const deleteQAChecklist = useCallback(async (jobId, locationId, attributeId) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase
        .from("qa_checklists")
        .delete()
        .eq("job_id", jobId)
        .eq("location_id", locationId)
        .eq("attribute_id", attributeId)

      if (deleteError) throw deleteError

      return { success: true }
    } catch (err) {
      console.error("Error deleting QA checklist:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  return {
    error,
    upsertQAChecklist,
    fetchQAChecklists,
    deleteQAChecklist,
  }
}

