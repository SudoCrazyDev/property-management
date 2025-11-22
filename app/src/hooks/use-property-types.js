import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing property types CRUD operations
 */
export function usePropertyTypes() {
  const [propertyTypes, setPropertyTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all property types
  const fetchPropertyTypes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("property_types")
        .select("*")
        .order("name", { ascending: true })

      if (fetchError) throw fetchError

      setPropertyTypes(data || [])
    } catch (err) {
      console.error("Error fetching property types:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new property type
  const createPropertyType = useCallback(async (name) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("property_types")
        .insert([{ name }])
        .select()
        .single()

      if (createError) throw createError

      setPropertyTypes((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return { success: true, data }
    } catch (err) {
      console.error("Error creating property type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing property type
  const updatePropertyType = useCallback(async (id, name) => {
    try {
      setError(null)
      const { data, error: updateError } = await supabase
        .from("property_types")
        .update({ name })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      setPropertyTypes((prev) =>
        prev.map((type) => (type.id === id ? data : type)).sort((a, b) => a.name.localeCompare(b.name))
      )
      return { success: true, data }
    } catch (err) {
      console.error("Error updating property type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a property type
  const deletePropertyType = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("property_types").delete().eq("id", id)

      if (deleteError) throw deleteError

      setPropertyTypes((prev) => prev.filter((type) => type.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting property type:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch property types on mount
  useEffect(() => {
    fetchPropertyTypes()
  }, [fetchPropertyTypes])

  return {
    propertyTypes,
    loading,
    error,
    createPropertyType,
    updatePropertyType,
    deletePropertyType,
    refetch: fetchPropertyTypes,
  }
}

