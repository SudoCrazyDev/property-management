import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"

/**
 * Hook for managing users CRUD operations
 */
export function useUsers() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch all users with role information
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase
        .from("users")
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false })

      if (fetchError) throw fetchError

      // Transform the data to include role name
      const transformedData = (data || []).map((user) => ({
        ...user,
        role: user.roles?.name || null,
        roleId: user.role_id,
        firstName: user.first_name,
        lastName: user.last_name,
        phoneNumber: user.phone_number,
      }))

      setUsers(transformedData)
    } catch (err) {
      console.error("Error fetching users:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new user
  const createUser = useCallback(async (userData) => {
    try {
      setError(null)
      const { data, error: createError } = await supabase
        .from("users")
        .insert([
          {
            first_name: userData.firstName,
            last_name: userData.lastName,
            email: userData.email,
            password_hash: userData.passwordHash,
            phone_number: userData.phoneNumber || null,
            birthday: userData.birthday || null,
            gender: userData.gender || null,
            role_id: userData.roleId,
            is_active: userData.isActive !== undefined ? userData.isActive : true,
          },
        ])
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .single()

      if (createError) throw createError

      // Transform the data
      const transformedUser = {
        ...data,
        role: data.roles?.name || null,
        roleId: data.role_id,
        firstName: data.first_name,
        lastName: data.last_name,
        phoneNumber: data.phone_number,
      }

      setUsers((prev) => [transformedUser, ...prev])
      return { success: true, data: transformedUser }
    } catch (err) {
      console.error("Error creating user:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Update an existing user
  const updateUser = useCallback(async (id, userData) => {
    try {
      setError(null)
      const updateData = {
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        phone_number: userData.phoneNumber || null,
        birthday: userData.birthday || null,
        gender: userData.gender || null,
        role_id: userData.roleId,
      }

      // Only update password if provided
      if (userData.passwordHash) {
        updateData.password_hash = userData.passwordHash
      }

      // Only update is_active if provided
      if (userData.isActive !== undefined) {
        updateData.is_active = userData.isActive
      }

      const { data, error: updateError } = await supabase
        .from("users")
        .update(updateData)
        .eq("id", id)
        .select(`
          *,
          roles (
            id,
            name
          )
        `)
        .single()

      if (updateError) throw updateError

      // Transform the data
      const transformedUser = {
        ...data,
        role: data.roles?.name || null,
        roleId: data.role_id,
        firstName: data.first_name,
        lastName: data.last_name,
        phoneNumber: data.phone_number,
      }

      setUsers((prev) =>
        prev.map((user) => (user.id === id ? transformedUser : user))
      )
      return { success: true, data: transformedUser }
    } catch (err) {
      console.error("Error updating user:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Delete a user
  const deleteUser = useCallback(async (id) => {
    try {
      setError(null)
      const { error: deleteError } = await supabase.from("users").delete().eq("id", id)

      if (deleteError) throw deleteError

      setUsers((prev) => prev.filter((user) => user.id !== id))
      return { success: true }
    } catch (err) {
      console.error("Error deleting user:", err)
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [])

  // Fetch users on mount
  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    refetch: fetchUsers,
  }
}

