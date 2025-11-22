import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing location attributes CRUD operations
 */
export function useLocationAttributes() {
  const [locationAttributes, setLocationAttributes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all location attributes
  const fetchLocationAttributes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("location_attributes")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setLocationAttributes(data || [])
    } catch (err) {
      console.error("Error fetching location attributes:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new location attribute
  const createLocationAttribute = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("location_attributes")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setLocationAttributes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating location attribute:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing location attribute
  const updateLocationAttribute = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("location_attributes")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setLocationAttributes((prev) =>
        prev.map((attribute) => (attribute.id === id ? data : attribute)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating location attribute:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a location attribute
  const deleteLocationAttribute = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("location_attributes").delete().eq("id", id)

      if (deleteError) throw deleteError

      setLocationAttributes((prev) => prev.filter((attribute) => attribute.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting location attribute:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch location attributes on mount
  useEffect(() => {
    fetchLocationAttributes()
  }, [fetchLocationAttributes])

  return {
    locationAttributes,
    loading,
    error,
    createLocationAttribute,
    updateLocationAttribute,
    deleteLocationAttribute,
    refetch: fetchLocationAttributes,
  }
}

