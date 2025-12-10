import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import { uploadPropertyImages, deletePropertyImages } from "@/lib/file-upload"

/**
 * Hook for managing properties CRUD operations
 */
export function useProperties() {
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all properties with related data
  const fetchProperties = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch properties with type and locations
      const { data, error: fetchError } = await supabase
        .from("properties")
        .select(`
          *,
          type:property_types(id, name),
          locations:property_location_assignments(
            location:property_locations(id, name)
          )
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Transform data to match frontend structure
      const transformedData = (data || []).map((property) => ({
        id: property.id,
        name: property.name,
        type: property.type?.name || "",
        typeId: property.type_id,
        streetAddress: property.street_address,
        unitNumber: property.unit_number,
        city: property.city,
        state: property.state,
        zipCode: property.zip_code,
        county: property.county,
        latitude: property.latitude,
        longitude: property.longitude,
        status: property.status,
        gallery: property.gallery || [],
        locations: property.locations?.map((assignment) => ({
          id: assignment.location?.id,
          name: assignment.location?.name,
        })) || [],
        createdAt: property.created_at,
        updatedAt: property.updated_at,
      }))

      setProperties(transformedData)
    } catch (err) {
      console.error("Error fetching properties:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new property
  const createProperty = useCallback(async (propertyData, imageFiles = []) => {
    try {
      setError(null)

      // Upload images if provided
      let galleryPaths = []
      if (imageFiles && imageFiles.length > 0) {
        galleryPaths = await uploadPropertyImages(imageFiles)
      }

      // Create property
      const { data: property, error: createError } = await supabase
        .from("properties")
        .insert([
          {
            name: propertyData.name,
            type_id: propertyData.typeId,
            street_address: propertyData.streetAddress,
            unit_number: propertyData.unitNumber || null,
            city: propertyData.city,
            state: propertyData.state,
            zip_code: propertyData.zipCode,
            county: propertyData.county,
            latitude: propertyData.latitude || null,
            longitude: propertyData.longitude || null,
            status: propertyData.status,
            gallery: galleryPaths,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Create location assignments
      if (propertyData.locationIds && propertyData.locationIds.length > 0) {
        const assignments = propertyData.locationIds.map((locationId) => ({
          property_id: property.id,
          location_id: locationId,
        }))

        const { error: assignmentError } = await supabase
          .from("property_location_assignments")
          .insert(assignments)

        if (assignmentError) throw assignmentError
      }

      // Refetch to get complete data
      await fetchProperties()

      return { success: true, data: property }
    } catch (err) {
      console.error("Error creating property:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [fetchProperties])

  // Update an existing property
  const updateProperty = useCallback(async (id, propertyData, imageFiles = [], imagesToDelete = []) => {
    try {
      setError(null)

      // Delete old images if specified
      if (imagesToDelete && imagesToDelete.length > 0) {
        await deletePropertyImages(imagesToDelete)
      }

      // Upload new images if provided
      let newImagePaths = []
      if (imageFiles && imageFiles.length > 0) {
        newImagePaths = await uploadPropertyImages(imageFiles)
      }

      // Get current property to merge gallery
      const { data: currentProperty } = await supabase
        .from("properties")
        .select("gallery")
        .eq("id", id)
        .single()

      // Merge galleries: keep existing, remove deleted, add new
      const existingGallery = currentProperty?.gallery || []
      const updatedGallery = [
        ...existingGallery.filter((path) => !imagesToDelete.includes(path)),
        ...newImagePaths,
      ]

      // Update property
      const { data: property, error: updateError } = await supabase
        .from("properties")
        .update({
          name: propertyData.name,
          type_id: propertyData.typeId,
          street_address: propertyData.streetAddress,
          unit_number: propertyData.unitNumber || null,
          city: propertyData.city,
          state: propertyData.state,
          zip_code: propertyData.zipCode,
          county: propertyData.county,
          latitude: propertyData.latitude || null,
          longitude: propertyData.longitude || null,
          status: propertyData.status,
          gallery: updatedGallery,
        })
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      // Update location assignments
      // First, delete existing assignments
      await supabase
        .from("property_location_assignments")
        .delete()
        .eq("property_id", id)

      // Then, create new assignments
      if (propertyData.locationIds && propertyData.locationIds.length > 0) {
        const assignments = propertyData.locationIds.map((locationId) => ({
          property_id: id,
          location_id: locationId,
        }))

        const { error: assignmentError } = await supabase
          .from("property_location_assignments")
          .insert(assignments)

        if (assignmentError) throw assignmentError
      }

      // Refetch to get complete data
      await fetchProperties()

      return { success: true, data: property }
    } catch (err) {
      console.error("Error updating property:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [fetchProperties])

  // Delete a property
  const deleteProperty = useCallback(async (id) => {
    try {
      setError(null)

      // Get property to delete images
      const { data: property } = await supabase
        .from("properties")
        .select("gallery")
        .eq("id", id)
        .single()

      // Delete images from storage
      if (property?.gallery && property.gallery.length > 0) {
        await deletePropertyImages(property.gallery)
      }

      // Delete location assignments (cascade should handle this, but being explicit)
      await supabase
        .from("property_location_assignments")
        .delete()
        .eq("property_id", id)

      // Delete property
      const { error: deleteError } = await supabase
        .from("properties")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setProperties((prev) => prev.filter((property) => property.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting property:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch properties on mount
  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  return {
    properties,
    loading,
    error,
    createProperty,
    updateProperty,
    deleteProperty,
    refetch: fetchProperties,
  }
}

