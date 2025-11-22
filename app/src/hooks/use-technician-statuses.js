import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing technician statuses CRUD operations
 */
export function useTechnicianStatuses() {
  const [technicianStatuses, setTechnicianStatuses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all technician statuses
  const fetchTechnicianStatuses = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("technician_statuses")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setTechnicianStatuses(data || [])
    } catch (err) {
      console.error("Error fetching technician statuses:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new technician status
  const createTechnicianStatus = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("technician_statuses")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setTechnicianStatuses((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating technician status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing technician status
  const updateTechnicianStatus = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("technician_statuses")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setTechnicianStatuses((prev) =>
        prev.map((status) => (status.id === id ? data : status)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating technician status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a technician status
  const deleteTechnicianStatus = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("technician_statuses").delete().eq("id", id)

      if (deleteError) throw deleteError

      setTechnicianStatuses((prev) => prev.filter((status) => status.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting technician status:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch technician statuses on mount
  useEffect(() => {
    fetchTechnicianStatuses()
  }, [fetchTechnicianStatuses])

  return {
    technicianStatuses,
    loading,
    error,
    createTechnicianStatus,
    updateTechnicianStatus,
    deleteTechnicianStatus,
    refetch: fetchTechnicianStatuses,
  }
}

