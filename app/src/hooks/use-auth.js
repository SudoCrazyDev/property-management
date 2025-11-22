import { useState, useEffect } from "react"
import { getCurrentUser, signOut as authSignOut } from "@/lib/auth"

/**
 * Hook to get current authenticated user
 * Returns user object, loading state, and logout function
 */
export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial user
    const currentUser = getCurrentUser()
    setUser(currentUser)
    setLoading(false)

    // Listen for storage changes (for multi-tab support)
    const handleStorageChange = (e) => {
      if (e.key === 'user_session' || e.key === null) {
        const updatedUser = getCurrentUser()
        setUser(updatedUser)
      }
    }

    window.addEventListener('storage', handleStorageChange)

    // Poll for session expiration
    const interval = setInterval(() => {
      const currentUser = getCurrentUser()
      setUser((prevUser) => {
        // Only update if user state actually changed
        if (!currentUser && prevUser) {
          return null
        }
        return prevUser
      })
    }, 60000) // Check every minute

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, []) // Empty dependency array - only run once on mount

  const logout = () => {
    authSignOut()
    setUser(null)
  }

  return {
    user,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.roles?.name === 'Admin',
    logout,
  }
}

