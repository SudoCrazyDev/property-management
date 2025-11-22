import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing property locations CRUD operations
 */
export function usePropertyLocations() {
  const [propertyLocations, setPropertyLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all property locations
  const fetchPropertyLocations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("property_locations")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setPropertyLocations(data || [])
    } catch (err) {
      console.error("Error fetching property locations:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new property location
  const createPropertyLocation = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("property_locations")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setPropertyLocations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating property location:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing property location
  const updatePropertyLocation = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("property_locations")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setPropertyLocations((prev) =>
        prev.map((location) => (location.id === id ? data : location)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating property location:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a property location
  const deletePropertyLocation = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("property_locations").delete().eq("id", id)

      if (deleteError) throw deleteError

      setPropertyLocations((prev) => prev.filter((location) => location.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting property location:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch property locations on mount
  useEffect(() => {
    fetchPropertyLocations()
  }, [fetchPropertyLocations])

  return {
    propertyLocations,
    loading,
    error,
    createPropertyLocation,
    updatePropertyLocation,
    deletePropertyLocation,
    refetch: fetchPropertyLocations,
  }
}

