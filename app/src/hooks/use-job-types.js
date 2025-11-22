import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing job types CRUD operations
 */
export function useJobTypes() {
  const [jobTypes, setJobTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all job types
  const fetchJobTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("job_types")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setJobTypes(data || [])
    } catch (err) {
      console.error("Error fetching job types:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new job type
  const createJobType = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("job_types")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setJobTypes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating job type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing job type
  const updateJobType = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("job_types")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setJobTypes((prev) =>
        prev.map((type) => (type.id === id ? data : type)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating job type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a job type
  const deleteJobType = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("job_types").delete().eq("id", id)

      if (deleteError) throw deleteError

      setJobTypes((prev) => prev.filter((type) => type.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting job type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch job types on mount
  useEffect(() => {
    fetchJobTypes()
  }, [fetchJobTypes])

  return {
    jobTypes,
    loading,
    error,
    createJobType,
    updateJobType,
    deleteJobType,
    refetch: fetchJobTypes,
  }
}

