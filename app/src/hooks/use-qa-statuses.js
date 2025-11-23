import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing QA statuses CRUD operations
 */
export function useQAStatuses() {
  const [qaStatuses, setQAStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all QA statuses
  const fetchQAStatuses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("qa_statuses")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setQAStatuses(data || [])
    } catch (err) {
      console.error("Error fetching QA statuses:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new QA status
  const createQAStatus = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("qa_statuses")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setQAStatuses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating QA status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing QA status
  const updateQAStatus = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("qa_statuses")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setQAStatuses((prev) =>
        prev.map((status) => (status.id === id ? data : status)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating QA status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a QA status
  const deleteQAStatus = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("qa_statuses").delete().eq("id", id)

      if (deleteError) throw deleteError

      setQAStatuses((prev) => prev.filter((status) => status.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting QA status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch QA statuses on mount
  useEffect(() => {
    fetchQAStatuses()
  }, [fetchQAStatuses])

  return {
    qaStatuses,
    loading,
    error,
    createQAStatus,
    updateQAStatus,
    deleteQAStatus,
    refetch: fetchQAStatuses,
  }
}

