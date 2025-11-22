import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing inspector statuses CRUD operations
 */
export function useInspectorStatuses() {
  const [inspectorStatuses, setInspectorStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all inspector statuses
  const fetchInspectorStatuses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("inspector_statuses")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setInspectorStatuses(data || [])
    } catch (err) {
      console.error("Error fetching inspector statuses:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new inspector status
  const createInspectorStatus = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("inspector_statuses")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setInspectorStatuses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating inspector status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing inspector status
  const updateInspectorStatus = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("inspector_statuses")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setInspectorStatuses((prev) =>
        prev.map((status) => (status.id === id ? data : status)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating inspector status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete an inspector status
  const deleteInspectorStatus = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("inspector_statuses").delete().eq("id", id)

      if (deleteError) throw deleteError

      setInspectorStatuses((prev) => prev.filter((status) => status.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting inspector status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch inspector statuses on mount
  useEffect(() => {
    fetchInspectorStatuses()
  }, [fetchInspectorStatuses])

  return {
    inspectorStatuses,
    loading,
    error,
    createInspectorStatus,
    updateInspectorStatus,
    deleteInspectorStatus,
    refetch: fetchInspectorStatuses,
  }
}

