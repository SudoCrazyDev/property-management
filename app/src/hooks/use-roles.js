import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing roles CRUD operations
 */
export function useRoles() {
  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all roles
  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("roles")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setRoles(data || [])
    } catch (err) {
      console.error("Error fetching roles:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new role
  const createRole = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("roles")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setRoles((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating role:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing role
  const updateRole = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("roles")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setRoles((prev) =>
        prev.map((role) => (role.id === id ? data : role)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating role:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a role
  const deleteRole = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("roles").delete().eq("id", id)

      if (deleteError) throw deleteError

      setRoles((prev) => prev.filter((role) => role.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting role:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch roles on mount
  useEffect(() => {
    fetchRoles()
  }, [fetchRoles])

  return {
    roles,
    loading,
    error,
    createRole,
    updateRole,
    deleteRole,
    refetch: fetchRoles,
  }
}

