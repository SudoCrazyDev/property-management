import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing jobs CRUD operations
 */
export function useJobs() {
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all jobs with related data
  const fetchJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch jobs with related data
      // Note: For multiple foreign keys to the same table, fetch users separately
      const { data: jobsData, error: fetchError } = await supabase
        .from("jobs")
        .select(`
          *,
          jobType:job_types(id, name),
          property:properties(id, name, street_address, unit_number, city, state, zip_code, latitude, longitude)
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Get all unique user IDs
      const userIds = new Set()
      jobsData?.forEach((job) => {
        if (job.inspector_id) userIds.add(job.inspector_id)
        if (job.technician_id) userIds.add(job.technician_id)
        if (job.qa_id) userIds.add(job.qa_id)
      })

      // Fetch all users in one query
      const usersMap = new Map()
      if (userIds.size > 0) {
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, first_name, last_name, email")
          .in("id", Array.from(userIds))

        if (usersError) throw usersError

        usersData?.forEach((user) => {
          usersMap.set(user.id, {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            email: user.email,
          })
        })
      }

      // Transform data to match frontend structure
      const transformedData = (jobsData || []).map((job) => ({
        id: job.id,
        jobType: job.jobType?.name || "",
        jobTypeId: job.job_type_id,
        date: job.date,
        property: {
          id: job.property?.id,
          name: job.property?.name || "",
          address: job.property?.street_address || "",
          city: job.property?.city || "",
          state: job.property?.state || "",
          zipCode: job.property?.zip_code || "",
          unitNumber: job.property?.unit_number || "",
          latitude: job.property?.latitude,
          longitude: job.property?.longitude,
          fullAddress: `${job.property?.street_address || ""}${job.property?.unit_number ? `, ${job.property.unit_number}` : ""}, ${job.property?.city || ""}, ${job.property?.state || ""} ${job.property?.zip_code || ""}`,
        },
        propertyId: job.property_id,
        inspector: job.inspector_id ? usersMap.get(job.inspector_id) || null : null,
        inspectorId: job.inspector_id,
        technician: job.technician_id ? usersMap.get(job.technician_id) || null : null,
        technicianId: job.technician_id,
        qa: job.qa_id ? usersMap.get(job.qa_id) || null : null,
        qaId: job.qa_id,
        status: job.status,
        inspectedDate: job.inspected_date,
        fixDate: job.fix_date,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      }))

      setJobs(transformedData)
    } catch (err) {
      console.error("Error fetching jobs:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new job
  const createJob = useCallback(async (jobData) => {
    try {
      setError(null)
      
      // Determine status: if inspector is assigned, set to "Waiting for Inspector"
      let status = jobData.status || "In-Review"
      if (jobData.inspectorId) {
        status = "Waiting for Inspector"
      }
      
      const { data, error: createError } = await supabase
        .from("jobs")
        .insert([
          {
            job_type_id: jobData.jobTypeId,
            date: jobData.date,
            property_id: jobData.propertyId,
            inspector_id: jobData.inspectorId || null,
            technician_id: jobData.technicianId || null,
            qa_id: jobData.qaId || null,
            status: status,
            inspected_date: jobData.inspectedDate || null,
            fix_date: jobData.fixDate || null,
          },
        ])
        .select()
        .single()

      if (createError) throw createError

      // Refetch to get complete data
      await fetchJobs()

      return { success: true, data }
    } catch (err) {
      console.error("Error creating job:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [fetchJobs])

  // Update an existing job
  const updateJob = useCallback(async (id, jobData) => {
    try {
      setError(null)
      
      // Build update object with only provided fields
      const updateData = {}
      
      // Only include fields that are explicitly provided (not undefined)
      if (jobData.jobTypeId !== undefined) updateData.job_type_id = jobData.jobTypeId
      if (jobData.date !== undefined) updateData.date = jobData.date
      if (jobData.propertyId !== undefined) updateData.property_id = jobData.propertyId
      if (jobData.inspectorId !== undefined) updateData.inspector_id = jobData.inspectorId
      if (jobData.technicianId !== undefined) updateData.technician_id = jobData.technicianId
      if (jobData.qaId !== undefined) updateData.qa_id = jobData.qaId
      if (jobData.inspectedDate !== undefined) updateData.inspected_date = jobData.inspectedDate
      if (jobData.fixDate !== undefined) updateData.fix_date = jobData.fixDate
      
      // Handle status with logic for inspector assignment
      if (jobData.status !== undefined) {
        let status = jobData.status
        // Only apply inspector assignment logic if status is "In-Review" or empty
        // This preserves explicitly set statuses like "Waiting for Technician"
        if (jobData.inspectorId !== undefined) {
          if (jobData.inspectorId && (status === "In-Review" || !status)) {
            // Inspector is being assigned and status is In-Review or empty
            status = "Waiting for Inspector"
          } else if (!jobData.inspectorId && status === "Waiting for Inspector") {
            // Inspector is being removed and status is Waiting for Inspector
            status = "In-Review"
          }
          // Otherwise, keep the explicitly provided status (e.g., "Waiting for Technician")
        }
        updateData.status = status
      }
      
      const { data, error: updateError } = await supabase
        .from("jobs")
        .update(updateData)
        .eq("id", id)
        .select()
        .single()

      if (updateError) throw updateError

      // Refetch to get complete data
      await fetchJobs()

      return { success: true, data }
    } catch (err) {
      console.error("Error updating job:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [fetchJobs])

  // Delete a job
  const deleteJob = useCallback(async (id) => {
    try {
      setError(null)
      
      const { error: deleteError } = await supabase
        .from("jobs")
        .delete()
        .eq("id", id)

      if (deleteError) throw deleteError

      setJobs((prev) => prev.filter((job) => job.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting job:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch jobs on mount
  useEffect(() => {
    fetchJobs()
  }, [fetchJobs])

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchJobs,
  }
}

